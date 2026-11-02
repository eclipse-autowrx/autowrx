#!/usr/bin/env bash
# snapshot.sh — portable, versioned snapshot of an AutoWRX instance deployment
# (MongoDB database + upload/plugin data) for migration, environment cloning
# and reproducible deployments.
#
# Usage:
#   ./snapshot.sh export [--out DIR] [--include-env] [-y]
#   ./snapshot.sh inspect <snapshot.tar>
#   ./snapshot.sh import  <snapshot.tar> [--dry-run] [--db-only|--data-only]
#                         [--no-safety-snapshot] [--allow-secret-mismatch] [-y]
#
# Unlike backup.sh/restore.sh (same-instance backups), a snapshot can be
# imported into ANOTHER instance: the database is renamed on the fly and data
# directories are mapped by role (upload, plugin, ...), not by host path.
#
# Bundle: snapshots/<NAME>-snapshot-<UTC timestamp>.tar containing
#   manifest.json     format "autowrx-snapshot", formatVersion, source info,
#                     sha256 + size of every member, per-collection counts
#   mongo.archive.gz  mongodump --archive --gzip of the instance database
#   data.tar.gz       data directories stored under role names
#   env.prod          only with --include-env (contains secrets!)
#
# Import is destructive: collections are replaced (--drop), collections not in
# the snapshot are dropped, and data directories are replaced. Before anything
# is changed a safety snapshot of the current state is exported (unless
# --no-safety-snapshot), and you must type the target instance name (unless -y).
# --dry-run prints the full plan and changes nothing.
#
# Overrides (mainly for scratch/test projects):
#   SNAPSHOT_ENV_FILE      env file          (default: ./.env.prod next to this script)
#   SNAPSHOT_COMPOSE_FILE  compose file relative *_PATH_HOST values resolve against
#                          (default: ./docker-compose.prod.yml)
#   SNAPSHOT_OUT_DIR       output directory  (default: ./snapshots)
#   WAIT_TIMEOUT           seconds to wait for the app to become healthy (default 180)

set -euo pipefail

FORMAT="autowrx-snapshot"
FORMAT_VERSION=1

INVOKE_DIR=$(pwd)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SCRIPT_PATH="$SCRIPT_DIR/$(basename "$0")"
cd "$SCRIPT_DIR"

abs_from_invoke() { # abs_from_invoke <path>: resolve relative to where the user ran us
  case "$1" in
    /*) echo "$1" ;;
    *) echo "$INVOKE_DIR/$1" ;;
  esac
}

ENV_FILE=$(abs_from_invoke "${SNAPSHOT_ENV_FILE:-$SCRIPT_DIR/.env.prod}")
COMPOSE_FILE=$(abs_from_invoke "${SNAPSHOT_COMPOSE_FILE:-$SCRIPT_DIR/docker-compose.prod.yml}")
OUT_DIR=$(abs_from_invoke "${SNAPSHOT_OUT_DIR:-$SCRIPT_DIR/snapshots}")
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"
COMPOSE_DIR=$(dirname "$COMPOSE_FILE")

die() { echo "ERROR: $*" >&2; exit 1; }

usage() {
  sed -n '6,10p' "$SCRIPT_PATH" | sed 's/^# \{0,1\}//'
  exit 1
}

# ---------------------------------------------------------------------------
# Environment of the instance this script operates on
# ---------------------------------------------------------------------------
env_get() { # env_get <KEY> <default>
  local v
  v=$(grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
  echo "${v:-$2}"
}

host_path() { # compose resolves relative bind paths against the compose file's directory
  case "$1" in
    /*) echo "$1" ;;
    *) echo "$COMPOSE_DIR/${1#./}" ;;
  esac
}

load_env() {
  [ -f "$ENV_FILE" ] || die "$ENV_FILE not found (copy .env.prod.sample and fill it in)"
  [ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE not found"
  NAME=$(env_get NAME prod)
  DB_NAME=$(env_get MONGODB_DATABASE autowrx)
  DB_CONTAINER="${NAME}-autowrx-db"
  APP_CONTAINER="${NAME}-autowrx"
  JWT_SECRET_VALUE=$(env_get JWT_SECRET "")
  # role -> host path. Order matters only for display.
  ROLES=(upload plugin builtin-widgets global.css)
  declare -gA ROLE_PATH=(
    [upload]=$(host_path "$(env_get UPLOAD_PATH_HOST ./data/upload)")
    [plugin]=$(host_path "$(env_get PLUGIN_PATH_HOST ./data/plugin)")
    [builtin-widgets]=$(host_path "$(env_get BUILTIN_WIDGETS_PATH_HOST ./data/builtin-widgets)")
    [global.css]=$(host_path "$(env_get GLOBAL_CSS_PATH_HOST ./data/global.css)")
  )
}

# The app is stopped/started with plain docker, not `docker compose up`: compose
# would recreate the container from only the files it is given here and drop
# overlays the operator started it with (e.g. docker-compose.widgets.yml).
wait_healthy() { # wait_healthy <container>: healthy (or running, if it has no healthcheck)
  local deadline=$((SECONDS + WAIT_TIMEOUT)) status
  while [ "$SECONDS" -lt "$deadline" ]; do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null || echo missing)
    case "$status" in
      healthy|running) return 0 ;;
      unhealthy|exited|dead|missing) return 1 ;;
    esac
    sleep 3
  done
  return 1
}

container_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null || true)" = "true" ]
}

jwt_fingerprint() {
  if [ -n "$JWT_SECRET_VALUE" ]; then
    printf '%s' "$JWT_SECRET_VALUE" | sha256sum | cut -c1-16 | sed 's/^/sha256:/'
  fi
}

db_tool() { # db_tool <mongodump|mongorestore>: find a working binary inside the db container
  if docker exec "$DB_CONTAINER" "$1" --version >/dev/null 2>&1; then
    echo "$1"
  elif docker exec "$DB_CONTAINER" "/opt/dbtools/$1" --version >/dev/null 2>&1; then
    echo "/opt/dbtools/$1"
  else
    die "no $1 available inside '$DB_CONTAINER' (see the tools-mount note in docker-compose.prod.yml)"
  fi
}

db_eval() { # db_eval <js>
  docker exec "$DB_CONTAINER" mongosh --quiet "$DB_NAME" --eval "$1"
}

collection_counts() { # JSON object {collection: count}
  db_eval 'const o={}; db.getCollectionNames().filter(c=>!c.startsWith("system.")).sort().forEach(c=>{o[c]=db.getCollection(c).countDocuments({})}); print(JSON.stringify(o))'
}

db_image() {
  docker inspect -f '{{.Config.Image}}' "$DB_CONTAINER" 2>/dev/null || echo "mongo:7.0"
}

# ---------------------------------------------------------------------------
# export
# ---------------------------------------------------------------------------
cmd_export() {
  local include_env=0 assume_yes=0 label=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --out) OUT_DIR=$(abs_from_invoke "$2"); shift 2 ;;
      --include-env) include_env=1; shift ;;
      --label) label="$2"; shift 2 ;; # internal: names the safety snapshot
      -y|--yes) assume_yes=1; shift ;;
      *) die "unknown export option: $1" ;;
    esac
  done
  load_env
  container_running "$DB_CONTAINER" || die "database container '$DB_CONTAINER' is not running (run ./up.sh first)"

  local entries=() role p
  for role in "${ROLES[@]}"; do
    p=${ROLE_PATH[$role]}
    if [ -e "$p" ]; then entries+=("$role"); fi
  done

  echo "=== AutoWRX snapshot export ==="
  echo "Instance:  $NAME"
  echo "Database:  $DB_NAME (container: $DB_CONTAINER)"
  for role in "${ROLES[@]}"; do
    p=${ROLE_PATH[$role]}
    if [ -e "$p" ]; then echo "Data:      $role <- $p"; else echo "Data:      $role (not present: $p — skipped)"; fi
  done
  echo "Output:    $OUT_DIR/"
  if [ "$include_env" -eq 1 ]; then
    echo "WARNING:   --include-env puts $ENV_FILE (with SECRETS) into the bundle. Store it accordingly."
  fi
  echo

  if [ "$assume_yes" -eq 0 ]; then
    local answer=""
    read -r -p "Proceed with export? [yes/N] " answer || true
    case "$answer" in
      yes|YES|Yes|y|Y) ;;
      *) echo "Aborted."; exit 1 ;;
    esac
  fi

  mkdir -p "$OUT_DIR"
  local stage ts bundle
  stage=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '$stage'" EXIT
  ts=$(date -u +%Y%m%d-%H%M%SZ)
  bundle="$OUT_DIR/${NAME}-snapshot-${label:+$label-}$ts.tar"

  # --- database ---
  local dump counts mongo_version
  dump=$(db_tool mongodump)
  echo "[db] dumping '$DB_NAME' via $dump"
  docker exec "$DB_CONTAINER" "$dump" --db="$DB_NAME" --archive --gzip --quiet > "$stage/mongo.archive.gz" \
    || die "mongodump failed (no bundle written)"
  gzip -t "$stage/mongo.archive.gz" || die "dump fails gzip integrity check (no bundle written)"
  counts=$(collection_counts)
  mongo_version=$(db_eval 'print(db.version())')
  echo "[db] OK ($(du -h "$stage/mongo.archive.gz" | cut -f1), mongo $mongo_version)"

  # --- data (archived inside a throwaway container: data dirs are owned by the app container's user) ---
  if [ "${#entries[@]}" -gt 0 ]; then
    local mounts=()
    for role in "${entries[@]}"; do mounts+=(-v "${ROLE_PATH[$role]}:/snap/$role:ro"); done
    echo "[data] archiving ${entries[*]}"
    docker run --rm --user 0 --entrypoint sh "${mounts[@]}" -v "$stage:/out" "$(db_image)" -c \
      "tar -czf /out/data.tar.gz -C /snap $(printf '%q ' "${entries[@]}") && chown $(id -u):$(id -g) /out/data.tar.gz" \
      || die "data archive failed (no bundle written)"
    echo "[data] OK ($(du -h "$stage/data.tar.gz" | cut -f1))"
  else
    echo "[data] no data directories present — snapshot has no data component"
  fi

  if [ "$include_env" -eq 1 ]; then cp "$ENV_FILE" "$stage/env.prod"; fi

  # --- manifest ---
  local app_image git_sha
  app_image=$(docker inspect -f '{{.Config.Image}}' "$APP_CONTAINER" 2>/dev/null || true)
  git_sha=$(git -C "$SCRIPT_DIR" rev-parse --short HEAD 2>/dev/null || true)
  STAGE="$stage" FORMAT="$FORMAT" FORMAT_VERSION="$FORMAT_VERSION" S_NAME="$NAME" S_DB="$DB_NAME" \
  S_MONGO="$mongo_version" S_APP_IMAGE="$app_image" S_GIT="$git_sha" S_JWT="$(jwt_fingerprint)" \
  S_COUNTS="$counts" S_ENTRIES="${entries[*]:-}" S_ENV="$include_env" python3 - <<'PY'
import hashlib, json, os, datetime
stage = os.environ["STAGE"]
def member(name):
    path = os.path.join(stage, name)
    if not os.path.exists(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return {"file": name, "sha256": h.hexdigest(), "bytes": os.path.getsize(path)}
mongo = member("mongo.archive.gz")
mongo["collections"] = json.loads(os.environ["S_COUNTS"])
data = member("data.tar.gz")
if data:
    data["entries"] = os.environ["S_ENTRIES"].split()
env = member("env.prod")
manifest = {
    "format": os.environ["FORMAT"],
    "formatVersion": int(os.environ["FORMAT_VERSION"]),
    "createdAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "tool": {"gitSha": os.environ["S_GIT"] or None},
    "source": {
        "name": os.environ["S_NAME"],
        "database": os.environ["S_DB"],
        "mongoServerVersion": os.environ["S_MONGO"],
        "appImage": os.environ["S_APP_IMAGE"] or None,
    },
    "jwtSecretFingerprint": os.environ["S_JWT"] or None,
    "components": {"mongo": mongo, "data": data, "env": env},
    "includesEnv": env is not None,
}
with open(os.path.join(stage, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
PY

  local members=(manifest.json mongo.archive.gz)
  [ -f "$stage/data.tar.gz" ] && members+=(data.tar.gz)
  [ -f "$stage/env.prod" ] && members+=(env.prod)
  tar -cf "$bundle.partial" -C "$stage" "${members[@]}"
  mv "$bundle.partial" "$bundle"
  if [ "$include_env" -eq 1 ]; then chmod 600 "$bundle"; fi
  echo
  echo "Snapshot written: $bundle ($(du -h "$bundle" | cut -f1))"
}

# ---------------------------------------------------------------------------
# bundle extraction + validation (shared by inspect and import)
# ---------------------------------------------------------------------------
# Sets: BUNDLE_STAGE and the M_* variables describing the manifest.
open_bundle() { # open_bundle <bundle.tar>
  local bundle=$1
  [ -f "$bundle" ] || die "snapshot '$bundle' not found"
  BUNDLE_STAGE=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '$BUNDLE_STAGE'" EXIT

  local m
  while IFS= read -r m; do
    case "${m#./}" in
      manifest.json|mongo.archive.gz|data.tar.gz|env.prod) ;;
      *) die "unexpected member '$m' in snapshot — refusing" ;;
    esac
  done < <(tar -tf "$bundle")
  tar -xf "$bundle" -C "$BUNDLE_STAGE" --no-same-owner
  [ -f "$BUNDLE_STAGE/manifest.json" ] || die "snapshot has no manifest.json"

  local out
  out=$(STAGE="$BUNDLE_STAGE" FORMAT="$FORMAT" MAX_VERSION="$FORMAT_VERSION" python3 - <<'PY'
import hashlib, json, os, sys, tarfile, posixpath
stage = os.environ["STAGE"]
def fail(msg):
    print("INVALID=" + msg)
    sys.exit(0)
try:
    m = json.load(open(os.path.join(stage, "manifest.json")))
except Exception as e:
    fail("manifest.json is not valid JSON (%s)" % e)
if m.get("format") != os.environ["FORMAT"]:
    fail("not an %s bundle (format=%r)" % (os.environ["FORMAT"], m.get("format")))
v = m.get("formatVersion")
if not isinstance(v, int) or v < 1:
    fail("invalid formatVersion %r" % v)
if v > int(os.environ["MAX_VERSION"]):
    fail("formatVersion %d is newer than this script supports (%s) — update snapshot.sh" % (v, os.environ["MAX_VERSION"]))
comps = m.get("components") or {}
if not comps.get("mongo") and not comps.get("data"):
    fail("snapshot has neither a mongo nor a data component")
for key, c in comps.items():
    if not c:
        continue
    path = os.path.join(stage, c["file"])
    if not os.path.isfile(path):
        fail("member %s listed in manifest is missing" % c["file"])
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    if h.hexdigest() != c["sha256"] or os.path.getsize(path) != c["bytes"]:
        fail("checksum mismatch for %s — bundle is corrupt or was modified" % c["file"])
data = comps.get("data")
if data:
    roles = set(data.get("entries") or [])
    allowed = {"upload", "plugin", "builtin-widgets", "global.css"}
    if not roles or not roles <= allowed:
        fail("data entries %r are not supported" % sorted(roles))
    with tarfile.open(os.path.join(stage, data["file"])) as t:
        for ti in t:
            n = posixpath.normpath(ti.name)
            if n.startswith("/") or n == ".." or n.startswith("../") or n.split("/")[0] not in roles:
                fail("unsafe or unexpected path %r in data.tar.gz" % ti.name)
            if (ti.issym() or ti.islnk()) and (ti.linkname.startswith("/") or ".." in ti.linkname.split("/")):
                fail("unsafe link %r -> %r in data.tar.gz" % (ti.name, ti.linkname))
src = m.get("source") or {}
mongo = comps.get("mongo") or {}
print("M_VERSION=%d" % v)
print("M_CREATED=%s" % m.get("createdAt", ""))
print("M_NAME=%s" % src.get("name", ""))
print("M_DB=%s" % src.get("database", ""))
print("M_MONGO=%s" % src.get("mongoServerVersion", ""))
print("M_JWT=%s" % (m.get("jwtSecretFingerprint") or ""))
print("M_HAS_MONGO=%d" % (1 if comps.get("mongo") else 0))
print("M_HAS_DATA=%d" % (1 if data else 0))
print("M_HAS_ENV=%d" % (1 if comps.get("env") else 0))
print("M_ENTRIES=%s" % " ".join(data.get("entries", [])) if data else "M_ENTRIES=")
print("M_COUNTS=%s" % json.dumps(mongo.get("collections", {})))
PY
)
  if grep -q '^INVALID=' <<<"$out"; then
    die "invalid snapshot: $(grep '^INVALID=' <<<"$out" | cut -d= -f2-)"
  fi
  M_VERSION=""; M_CREATED=""; M_NAME=""; M_DB=""; M_MONGO=""; M_JWT=""
  M_HAS_MONGO=0; M_HAS_DATA=0; M_HAS_ENV=0; M_ENTRIES=""; M_COUNTS="{}"
  local line
  while IFS= read -r line; do
    case "$line" in
      M_*=*) printf -v "${line%%=*}" '%s' "${line#*=}" ;;
    esac
  done <<<"$out"
  [[ "$M_DB" =~ ^[A-Za-z0-9_-]+$ ]] || die "invalid source database name in manifest: '$M_DB'"
  if [ "$M_HAS_MONGO" -eq 1 ]; then
    gzip -t "$BUNDLE_STAGE/mongo.archive.gz" || die "mongo.archive.gz fails gzip integrity check"
  fi
  if [ "$M_HAS_DATA" -eq 1 ]; then
    gzip -t "$BUNDLE_STAGE/data.tar.gz" || die "data.tar.gz fails gzip integrity check"
  fi
}

# ---------------------------------------------------------------------------
# inspect
# ---------------------------------------------------------------------------
cmd_inspect() {
  [ $# -eq 1 ] || die "usage: ./snapshot.sh inspect <snapshot.tar>"
  open_bundle "$(abs_from_invoke "$1")"
  cat "$BUNDLE_STAGE/manifest.json"
  echo
  echo "Snapshot OK: format v$M_VERSION, checksums and archive integrity verified."
}

# ---------------------------------------------------------------------------
# import
# ---------------------------------------------------------------------------
cmd_import() {
  local bundle="" dry_run=0 db_only=0 data_only=0 safety=1 allow_mismatch=0 assume_yes=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run) dry_run=1; shift ;;
      --db-only) db_only=1; shift ;;
      --data-only) data_only=1; shift ;;
      --no-safety-snapshot) safety=0; shift ;;
      --allow-secret-mismatch) allow_mismatch=1; shift ;;
      -y|--yes) assume_yes=1; shift ;;
      -*) die "unknown import option: $1" ;;
      *) [ -z "$bundle" ] || die "only one snapshot file may be given"; bundle=$(abs_from_invoke "$1"); shift ;;
    esac
  done
  [ -n "$bundle" ] || die "usage: ./snapshot.sh import <snapshot.tar> [--dry-run] [-y] ..."
  [ "$db_only" -eq 1 ] && [ "$data_only" -eq 1 ] && die "--db-only and --data-only are mutually exclusive"

  load_env
  open_bundle "$bundle"

  local do_db=$M_HAS_MONGO do_data=$M_HAS_DATA
  [ "$data_only" -eq 1 ] && do_db=0
  [ "$db_only" -eq 1 ] && do_data=0
  [ "$do_db" -eq 1 ] || [ "$do_data" -eq 1 ] || die "nothing to import (snapshot lacks the requested component)"

  local db_up=0 app_up=0
  container_running "$DB_CONTAINER" && db_up=1
  container_running "$APP_CONTAINER" && app_up=1

  # ----- plan -----
  if [ "$dry_run" -eq 1 ]; then
    echo "=== AutoWRX snapshot import (DRY RUN — nothing will be changed) ==="
  else
    echo "=== AutoWRX snapshot import ==="
  fi
  echo "Snapshot:   $bundle"
  echo "            format v$M_VERSION, created $M_CREATED, from instance '$M_NAME' / database '$M_DB' (mongo $M_MONGO)"
  echo "Target:     instance '$NAME', database '$DB_NAME' (container: $DB_CONTAINER)"
  local warnings=()

  local current="{}"
  if [ "$do_db" -eq 1 ]; then
    if [ "$db_up" -eq 1 ]; then
      current=$(collection_counts)
      local target_mongo
      target_mongo=$(db_eval 'print(db.version())')
      if [ -n "$M_MONGO" ] && [ "${M_MONGO%%.*}" != "${target_mongo%%.*}" ]; then
        warnings+=("MongoDB major version differs: snapshot $M_MONGO, target $target_mongo")
      fi
    else
      [ "$dry_run" -eq 1 ] || die "database container '$DB_CONTAINER' is not running (run ./up.sh first)"
      warnings+=("database container '$DB_CONTAINER' is not running — current counts unknown")
    fi
    echo
    if [ "$M_DB" != "$DB_NAME" ]; then
      echo "Database:   '$M_DB' will be imported AS '$DB_NAME' (collections replaced, --drop)"
    else
      echo "Database:   collections replaced (--drop)"
    fi
    SNAP="$M_COUNTS" CUR="$current" python3 - <<'PY'
import json, os
snap, cur = json.loads(os.environ["SNAP"]), json.loads(os.environ["CUR"])
names = sorted(set(snap) | set(cur))
w = max([len(n) for n in names] + [10])
print("            %-*s %10s %10s  %s" % (w, "collection", "current", "snapshot", "action"))
for n in names:
    action = "replace" if n in snap and n in cur else ("create" if n in snap else "DROP (not in snapshot)")
    print("            %-*s %10s %10s  %s" % (w, n, cur.get(n, "-"), snap.get(n, "-"), action))
PY
  fi

  if [ "$do_data" -eq 1 ]; then
    echo
    local role
    for role in $M_ENTRIES; do
      local p=${ROLE_PATH[$role]}
      if [ -e "$p" ]; then
        echo "Data:       $role -> $p (current contents REPLACED)"
      else
        echo "Data:       $role -> $p (created)"
      fi
    done
  fi

  local target_fp mismatch=0
  target_fp=$(jwt_fingerprint)
  if [ "$do_db" -eq 1 ]; then
    if [ -n "$M_JWT" ] && [ -n "$target_fp" ] && [ "$M_JWT" != "$target_fp" ]; then
      mismatch=1
      warnings+=("JWT_SECRET differs from the source instance: data encrypted at rest will NOT decrypt and sessions break")
    elif [ -z "$M_JWT" ] || [ -z "$target_fp" ]; then
      warnings+=("cannot compare JWT_SECRET (not in env file on one side, e.g. Key Vault) — make sure both instances use the same secret")
    fi
  fi
  if [ "$app_up" -eq 1 ]; then
    echo
    echo "App:        $APP_CONTAINER will be stopped during import and restarted after"
  fi
  if [ "$M_HAS_ENV" -eq 1 ]; then
    echo "Env:        snapshot contains env.prod — it is NOT applied; current $ENV_FILE stays"
  fi
  if [ "$safety" -eq 1 ]; then
    echo "Safety:     current state is exported to $OUT_DIR/ before any change"
  else
    echo "Safety:     NO safety snapshot (--no-safety-snapshot)"
  fi
  local w
  for w in "${warnings[@]}"; do echo "WARNING:    $w"; done
  echo

  if [ "$dry_run" -eq 1 ]; then
    echo "Dry run: no changes made."
    return 0
  fi

  # ----- confirmation -----
  local answer=""
  if [ "$mismatch" -eq 1 ] && [ "$allow_mismatch" -eq 0 ]; then
    [ "$assume_yes" -eq 0 ] || die "JWT_SECRET mismatch — refusing under -y (pass --allow-secret-mismatch to override)"
    read -r -p "JWT_SECRET differs. Type 'yes' to import anyway: " answer || true
    [ "$answer" = "yes" ] || { echo "Aborted."; exit 1; }
  fi
  if [ "$assume_yes" -eq 0 ]; then
    read -r -p "This is destructive. Type the target instance name ('$NAME') to proceed: " answer || true
    [ "$answer" = "$NAME" ] || { echo "Aborted."; exit 1; }
  fi

  # ----- safety snapshot -----
  if [ "$safety" -eq 1 ]; then
    echo "[safety] exporting current state"
    SNAPSHOT_ENV_FILE="$ENV_FILE" SNAPSHOT_COMPOSE_FILE="$COMPOSE_FILE" SNAPSHOT_OUT_DIR="$OUT_DIR" \
      "$SCRIPT_PATH" export -y --label pre-import | sed 's/^/[safety] /' \
      || die "safety snapshot failed — nothing was changed (use --no-safety-snapshot to skip)"
  fi

  # ----- stop app -----
  APP_WAS_RUNNING=$app_up
  if [ "$APP_WAS_RUNNING" -eq 1 ]; then
    echo "[app] stopping $APP_CONTAINER"
    docker stop "$APP_CONTAINER" >/dev/null
    # shellcheck disable=SC2064
    trap "rm -rf '$BUNDLE_STAGE'; [ \"\$APP_WAS_RUNNING\" -eq 1 ] && docker start '$APP_CONTAINER' >/dev/null || true" EXIT
  fi

  # ----- database -----
  if [ "$do_db" -eq 1 ]; then
    local restore
    restore=$(db_tool mongorestore)
    echo "[db] restoring '$M_DB' -> '$DB_NAME' via $restore (--drop)"
    docker exec -i "$DB_CONTAINER" "$restore" --archive --gzip --drop --quiet \
      --nsInclude="$M_DB.*" --nsFrom="$M_DB.*" --nsTo="$DB_NAME.*" < "$BUNDLE_STAGE/mongo.archive.gz" \
      || die "mongorestore failed — database may be partial; re-import or use the safety snapshot"
    # Collections created after the snapshot are not touched by --drop; remove them for an exact replica.
    local keep
    keep=$(python3 -c 'import json,sys; print(json.dumps(sorted(json.loads(sys.argv[1]))))' "$M_COUNTS")
    db_eval "const keep=new Set($keep); db.getCollectionNames().filter(c=>!c.startsWith('system.') && !keep.has(c)).forEach(c=>{db.getCollection(c).drop(); print('[db] dropped '+c+' (not in snapshot)')})"
    local after
    after=$(collection_counts)
    if SNAP="$M_COUNTS" CUR="$after" python3 -c 'import json,os,sys; sys.exit(0 if json.loads(os.environ["SNAP"])==json.loads(os.environ["CUR"]) else 1)'; then
      echo "[db] OK — collection counts match the snapshot"
    else
      echo "[db] WARNING — counts differ from manifest (writes during export?): $after"
    fi
  fi

  # ----- data -----
  if [ "$do_data" -eq 1 ]; then
    local role image
    image=$(db_image)
    for role in $M_ENTRIES; do
      local p=${ROLE_PATH[$role]} parent base
      parent=$(dirname "$p"); base=$(basename "$p")
      echo "[data] $role -> $p"
      # Extract next to the target first; replace the old copy only after extraction succeeded.
      docker run --rm --user 0 --entrypoint sh -v "$BUNDLE_STAGE/data.tar.gz:/in/data.tar.gz:ro" -v "$parent:/target" "$image" -c '
        set -e
        tmp="/target/.snapshot-import-$1"
        rm -rf "$tmp"; mkdir -p "$tmp"
        tar -xzf /in/data.tar.gz --same-owner -C "$tmp" "$1"
        rm -rf "/target/$2"
        mv "$tmp/$1" "/target/$2"
        rmdir "$tmp"' sh "$role" "$base" \
        || die "data import of '$role' failed — the previous '$p' is left in place if extraction failed"
    done
    echo "[data] OK"
  fi

  # ----- restart -----
  if [ "$APP_WAS_RUNNING" -eq 1 ]; then
    echo "[app] starting $APP_CONTAINER (waiting up to ${WAIT_TIMEOUT}s for healthy)"
    APP_WAS_RUNNING=0
    docker start "$APP_CONTAINER" >/dev/null
    wait_healthy "$APP_CONTAINER" || die "app did not become healthy — check: docker logs $APP_CONTAINER"
  fi
  echo
  echo "Import complete into instance '$NAME' / database '$DB_NAME'."
}

# ---------------------------------------------------------------------------
[ $# -ge 1 ] || usage
cmd=$1; shift
case "$cmd" in
  export) cmd_export "$@" ;;
  inspect) cmd_inspect "$@" ;;
  import) cmd_import "$@" ;;
  -h|--help|help) usage ;;
  *) echo "Unknown command: $cmd"; usage ;;
esac
