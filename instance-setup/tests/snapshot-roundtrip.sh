#!/usr/bin/env bash
# snapshot-roundtrip.sh — end-to-end check of ../snapshot.sh on scratch compose
# projects. Self-contained: creates throwaway compose projects from
# docker-compose.prod.yml, runs export/inspect/import, and always tears
# everything down (containers, volumes, networks, temp dirs).
#
# Usage: instance-setup/tests/snapshot-roundtrip.sh
#
# Scenarios:
#   - MongoDB-only projects (always): export/inspect, dry-run, confirmation,
#     same- and cross-instance import, and bundle/secret safety checks.
#   - Full stack (opt-in): set SNAPSHOT_TEST_APP_IMAGE to a locally available
#     AutoWRX app image (e.g. autowrx:e2e) to import into an instance whose app
#     container is running, started with an extra compose overlay.
#
# SNAPSHOT_TEST_REPORT=<file.json> writes a machine-readable result report.
# Needs: docker (compose v2), python3, the mongo image used by docker-compose.prod.yml.

set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
SNAP="$HERE/../snapshot.sh"
COMPOSE_FILE="$HERE/../docker-compose.prod.yml"
TMP=$(mktemp -d)
SRC="snaptest-src-$$"
DST="snaptest-dst-$$"
APP="snaptest-app-$$"
APP_IMAGE="${SNAPSHOT_TEST_APP_IMAGE:-}"
REPORT="${SNAPSHOT_TEST_REPORT:-}"
case "$REPORT" in /*|"") ;; *) REPORT="$(pwd)/$REPORT" ;; esac
RESULTS="$TMP/report/results.tsv"
mkdir -p "$TMP/report"
: > "$RESULTS"
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PASS=0
SECTION="setup"
T0=$SECONDS

now() { date +%s.%N; }
CHECK_T=$(now)
elapsed() { python3 -c "import sys; print('%.1f' % (float(sys.argv[2]) - float(sys.argv[1])))" "$CHECK_T" "$(now)"; }
record() { # record <status> <name> <detail>
  printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$SECTION" "$2" "$(elapsed)" "$(tr '\t\n' '  ' <<<"$3")" >> "$RESULTS"
  CHECK_T=$(now)
}
log() { SECTION="$*"; echo "--- $*"; }
fail() { record fail "$*" ""; echo "FAIL: $*" >&2; exit 1; }
ok() { PASS=$((PASS + 1)); record pass "$1" "${2:-}"; echo "ok $PASS - $1"; }
skip() { record skip "$1" "${2:-}"; echo "skip - $1 (${2:-})"; }

write_report() {
  [ -n "$REPORT" ] || return 0
  RESULTS="$RESULTS" ART="$TMP/report" OUT="$REPORT" STARTED_AT="$STARTED_AT" DURATION=$((SECONDS - T0)) \
  APP_IMAGE="$APP_IMAGE" RC="$1" GIT_SHA="$(git -C "$HERE" rev-parse --short HEAD 2>/dev/null || true)" \
  GIT_BRANCH="$(git -C "$HERE" rev-parse --abbrev-ref HEAD 2>/dev/null || true)" \
  GIT_DIRTY="$(git -C "$HERE" status --porcelain -- .. 2>/dev/null | wc -l)" \
  DOCKER="$(docker version -f '{{.Server.Version}}' 2>/dev/null || true)" \
  COMPOSE="$(docker compose version --short 2>/dev/null || true)" \
  MONGO_IMAGE="$(grep -E '^\s*image: mongo' "$COMPOSE_FILE" | awk '{print $2}')" python3 - <<'PY'
import json, os, platform
art = os.environ["ART"]
checks = []
for line in open(os.environ["RESULTS"]):
    status, section, name, secs, detail = (line.rstrip("\n").split("\t") + [""] * 5)[:5]
    checks.append({"status": status, "section": section, "name": name, "seconds": float(secs or 0), "detail": detail})
def text(name):
    p = os.path.join(art, name)
    return open(p, errors="replace").read() if os.path.exists(p) else None
manifest = text("manifest.json")
report = {
    "suite": "instance-setup/tests/snapshot-roundtrip.sh",
    "startedAt": os.environ["STARTED_AT"],
    "durationSeconds": int(os.environ["DURATION"]),
    "exitCode": int(os.environ["RC"]),
    "result": "pass" if os.environ["RC"] == "0" else "fail",
    "env": {
        "gitSha": os.environ["GIT_SHA"], "gitBranch": os.environ["GIT_BRANCH"],
        "uncommittedFiles": int(os.environ["GIT_DIRTY"] or 0),
        "docker": os.environ["DOCKER"], "compose": os.environ["COMPOSE"],
        "mongoImage": os.environ["MONGO_IMAGE"], "appImage": os.environ["APP_IMAGE"] or None,
        "host": platform.platform(),
    },
    "summary": {s: sum(1 for c in checks if c["status"] == s) for s in ("pass", "fail", "skip")},
    "checks": checks,
    "artifacts": {
        "manifest": json.loads(manifest) if manifest else None,
        "dryRunPlan": text("dry-run.txt"),
        "appImportLog": text("app-import.txt"),
    },
}
with open(os.environ["OUT"], "w") as f:
    json.dump(report, f, indent=2)
print("report written: " + os.environ["OUT"])
PY
}

cleanup() {
  local rc=$?
  for p in "$SRC" "$DST" "$APP"; do
    if [ -f "$TMP/$p.env" ]; then
      docker compose -p "$p" -f "$COMPOSE_FILE" --env-file "$TMP/$p.env" down -v --remove-orphans >/dev/null 2>&1 || true
    fi
  done
  write_report "$rc" || true
  # Restored/app-written data may be owned by another uid; remove via a container if needed
  rm -rf "$TMP" 2>/dev/null || docker run --rm --user 0 --entrypoint sh -v "$TMP:/t" mongo:7.0 -c 'rm -rf /t/* /t/.[!.]*' >/dev/null 2>&1 || true
  rm -rf "$TMP" 2>/dev/null || true
  if [ "$rc" -eq 0 ]; then echo "PASS ($PASS checks)"; else echo "FAILED (after $PASS passing checks)" >&2; fi
}
trap cleanup EXIT

write_env() { # write_env <project> <db> <jwt> <envfile> [extra lines...]
  local p=$1 db=$2 jwt=$3 file=$4; shift 4
  mkdir -p "$TMP/$p"
  {
    echo "NAME=$p"
    echo "MONGODB_DATABASE=$db"
    echo "JWT_SECRET=$jwt"
    echo "UPLOAD_PATH_HOST=$TMP/$p/upload"
    echo "PLUGIN_PATH_HOST=$TMP/$p/plugin"
    # Keep every data role inside the scratch dir; the defaults point at the repo's real ./data
    echo "BUILTIN_WIDGETS_PATH_HOST=$TMP/$p/widgets"
    echo "GLOBAL_CSS_PATH_HOST=$TMP/$p/global.css"
    echo "CORS_ORIGINS=localhost"
    echo "ADMIN_EMAILS=admin@example.com"
    for l in "$@"; do echo "$l"; done
  } > "$file"
}

up_db() { # up_db <project>
  docker compose -p "$1" -f "$COMPOSE_FILE" --env-file "$TMP/$1.env" up -d --wait --wait-timeout 120 autowrx-db >/dev/null 2>&1
}

snap() { # snap <project> <args...>  (runs snapshot.sh against that scratch project)
  local p=$1; shift
  SNAPSHOT_ENV_FILE="$TMP/$p.env" SNAPSHOT_COMPOSE_FILE="$COMPOSE_FILE" SNAPSHOT_OUT_DIR="$TMP/snapshots-$p" "$SNAP" "$@"
}

mongo() { # mongo <project> <db> <js>
  docker exec "$1-autowrx-db" mongosh --quiet "$2" --eval "$3"
}

state() { # state <project> <db>: collection counts + index names + file hashes
  mongo "$1" "$2" 'db.getCollectionNames().filter(c=>!c.startsWith("system.")).sort().forEach(c=>print(c, db.getCollection(c).countDocuments({}), db.getCollection(c).getIndexes().map(i=>i.name).sort().join(",")))'
  mongo "$1" "$2" 'print(JSON.stringify(db.models.find({}, {_id:0}).sort({n:1}).toArray()))'
  (cd "$TMP/$1" && find upload plugin -print0 2>/dev/null | sort -z | xargs -0 -I{} sh -c 'if [ -f "{}" ]; then sha256sum "{}"; else echo "dir {}"; fi')
}

latest() { ls -1t "$1"/*-snapshot-*.tar | grep -v pre-import | head -1; }

retar() { # retar <bundle> <out> <python-mutation-on-dir>
  local d; d=$(mktemp -d -p "$TMP")
  tar -xf "$1" -C "$d"
  python3 -c "$3" "$d"
  (cd "$d" && tar -cf "$2" ./*)
}

free_port() { python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])'; }

# ---------------------------------------------------------------------------
log "setup"
write_env "$SRC" snapsrc same-secret "$TMP/$SRC.env"
write_env "$DST" snapdst same-secret "$TMP/$DST.env"
up_db "$SRC" || fail "could not start scratch project $SRC"

mongo "$SRC" snapsrc '
  db.users.insertMany([{email:"a@x"},{email:"b@x"},{email:"c@x"}]);
  db.users.createIndex({email:1},{unique:true});
  db.models.insertMany([...Array(5).keys()].map(n=>({n, name:"m"+n, tags:["t"+n]})));
  db.plugins.insertMany([{slug:"p1"},{slug:"p2"}]);' >/dev/null
mkdir -p "$TMP/$SRC/upload/nested/deep" "$TMP/$SRC/plugin/p1"
echo "hello" > "$TMP/$SRC/upload/a.txt"
echo '{"k":1}' > "$TMP/$SRC/upload/nested/deep/b.json"
head -c 4096 /dev/urandom > "$TMP/$SRC/upload/bin.dat"
echo "export default 1" > "$TMP/$SRC/plugin/p1/index.js"
ORIG=$(state "$SRC" snapsrc)
[ -n "$ORIG" ] || fail "could not capture source state"
ok "scratch MongoDB-only project started and seeded" "3 collections (users with unique index, models, plugins), 4 files in upload/plugin incl. nested dir and 4 KiB binary"

# ---------------------------------------------------------------------------
log "export + inspect"
snap "$SRC" export -y >/dev/null
BUNDLE=$(latest "$TMP/snapshots-$SRC")
[ -f "$BUNDLE" ] || fail "no bundle written"
ok "export wrote a bundle" "$(basename "$BUNDLE"), $(du -h "$BUNDLE" | cut -f1)"
INSPECT=$(snap "$SRC" inspect "$BUNDLE")
grep -q "Snapshot OK" <<<"$INSPECT" || fail "inspect did not validate the bundle"
tar -xOf "$BUNDLE" manifest.json > "$TMP/report/manifest.json"
python3 - "$BUNDLE" <<'PY' || fail "manifest content unexpected"
import json, sys, tarfile
m = json.load(tarfile.open(sys.argv[1]).extractfile("manifest.json"))
assert m["format"] == "autowrx-snapshot" and m["formatVersion"] == 1, m
assert m["source"]["database"] == "snapsrc", m["source"]
assert m["components"]["mongo"]["collections"] == {"models": 5, "plugins": 2, "users": 3}, m["components"]["mongo"]
assert m["components"]["data"]["entries"] == ["upload", "plugin"], m["components"]["data"]
assert m["jwtSecretFingerprint"].startswith("sha256:") and "same-secret" not in json.dumps(m)
assert m["includesEnv"] is False
PY
ok "inspect validates; manifest is versioned with counts, entries, checksums and no secret" "formatVersion 1, collections {models:5, plugins:2, users:3}, entries [upload, plugin], JWT stored as fingerprint only"

# ---------------------------------------------------------------------------
log "mutate source"
mongo "$SRC" snapsrc 'db.models.drop(); db.users.insertOne({email:"late@x"}); db.extra.insertOne({x:1});' >/dev/null
rm "$TMP/$SRC/upload/a.txt"
echo "changed" > "$TMP/$SRC/plugin/p1/index.js"
echo "new" > "$TMP/$SRC/upload/new.txt"
MUTATED=$(state "$SRC" snapsrc)
[ "$MUTATED" != "$ORIG" ] || fail "mutation had no effect"
ok "source mutated after the snapshot" "dropped models, +1 user, new collection extra, deleted a.txt, changed index.js, added new.txt"

log "dry-run"
DRY=$(snap "$SRC" import "$BUNDLE" --dry-run)
echo "$DRY" > "$TMP/report/dry-run.txt"
grep -q "Dry run: no changes made." <<<"$DRY" || fail "dry-run output missing marker"
grep -q "extra .*DROP" <<<"$DRY" || fail "dry-run plan does not show the collection to drop"
[ "$(state "$SRC" snapsrc)" = "$MUTATED" ] || fail "dry-run modified the instance"
[ ! -d "$TMP/snapshots-$SRC" ] || ! ls "$TMP/snapshots-$SRC" | grep -q pre-import || fail "dry-run wrote a safety snapshot"
ok "import --dry-run prints the plan and changes nothing" "plan lists replace/create/DROP per collection; DB, files and snapshot dir unchanged"

log "confirmation"
if echo "not-the-name" | snap "$SRC" import "$BUNDLE" >/dev/null 2>&1; then fail "import proceeded without correct confirmation"; fi
[ "$(state "$SRC" snapsrc)" = "$MUTATED" ] || fail "aborted import modified the instance"
ok "wrong instance name at the prompt aborts with no changes" "exit 1, state unchanged"

log "same-instance import"
echo "$SRC" | snap "$SRC" import "$BUNDLE" >/dev/null
[ "$(state "$SRC" snapsrc)" = "$ORIG" ] || { diff <(echo "$ORIG") <(state "$SRC" snapsrc) || true; fail "state after import differs from snapshot"; }
ok "typed confirmation + import restores the snapshot exactly" "counts, documents, indexes and file hashes equal the original; collection 'extra' dropped; new.txt removed"
ls "$TMP/snapshots-$SRC" | grep -q pre-import || fail "no safety snapshot written"
ok "safety snapshot of the pre-import state was written" "$(ls "$TMP/snapshots-$SRC" | grep pre-import)"

# ---------------------------------------------------------------------------
log "cross-instance import"
up_db "$DST" || fail "could not start scratch project $DST"
snap "$DST" import "$BUNDLE" -y >/dev/null
[ "$(state "$DST" snapdst)" = "$ORIG" ] || { diff <(echo "$ORIG") <(state "$DST" snapdst) || true; fail "cross-instance state differs"; }
[ "$(mongo "$DST" snapsrc 'print(db.getCollectionNames().length)')" = "0" ] || fail "source database name leaked into target"
ok "cross-instance import reproduces DB and data under the target's names" "snapsrc -> snapdst; data mapped to the target's UPLOAD/PLUGIN paths; no snapsrc database created"

# ---------------------------------------------------------------------------
log "safety checks"
write_env "$DST" snapdst other-secret "$TMP/$DST-mismatch.env"
if SNAPSHOT_ENV_FILE="$TMP/$DST-mismatch.env" SNAPSHOT_COMPOSE_FILE="$COMPOSE_FILE" \
   SNAPSHOT_OUT_DIR="$TMP/snapshots-$DST" "$SNAP" import "$BUNDLE" -y >/dev/null 2>&1; then
  fail "import with a different JWT_SECRET was not refused under -y"
fi
ok "JWT_SECRET mismatch is refused under -y" "fingerprints differ -> exit 1 before any change"

retar "$BUNDLE" "$TMP/tampered.tar" 'import sys; p=sys.argv[1]+"/data.tar.gz"; b=bytearray(open(p,"rb").read()); b[-20]^=0xff; open(p,"wb").write(b)'
if snap "$SRC" inspect "$TMP/tampered.tar" >/dev/null 2>&1; then fail "tampered bundle passed inspect"; fi
ok "tampered bundle is rejected" "one flipped byte in data.tar.gz -> checksum mismatch"

retar "$BUNDLE" "$TMP/future.tar" 'import sys,json; p=sys.argv[1]+"/manifest.json"; m=json.load(open(p)); m["formatVersion"]=99; json.dump(m,open(p,"w"))'
OUT=$(snap "$SRC" inspect "$TMP/future.tar" 2>&1 || true)
grep -q "newer than this script supports" <<<"$OUT" || fail "future formatVersion not refused: $OUT"
ok "newer formatVersion is refused" "formatVersion 99 > supported 1"

retar "$BUNDLE" "$TMP/extra.tar" 'import sys; open(sys.argv[1]+"/evil.sh","w").write("x")'
if snap "$SRC" inspect "$TMP/extra.tar" >/dev/null 2>&1; then fail "bundle with unexpected member passed"; fi
ok "unexpected bundle member is rejected" "evil.sh in the outer tar"

retar "$BUNDLE" "$TMP/traversal.tar" '
import sys, tarfile, io, hashlib, json, os
d = sys.argv[1]
with tarfile.open(d + "/data.tar.gz", "w:gz") as t:
    ti = tarfile.TarInfo("upload/../../escape.txt"); data = b"x"; ti.size = len(data)
    t.addfile(ti, io.BytesIO(data))
m = json.load(open(d + "/manifest.json"))
b = open(d + "/data.tar.gz", "rb").read()
m["components"]["data"].update(sha256=hashlib.sha256(b).hexdigest(), bytes=len(b))
json.dump(m, open(d + "/manifest.json", "w"))'
OUT=$(snap "$SRC" inspect "$TMP/traversal.tar" 2>&1 || true)
grep -q "unsafe or unexpected path" <<<"$OUT" || fail "path traversal in data.tar.gz not refused: $OUT"
ok "path traversal inside data.tar.gz is rejected" "upload/../../escape.txt with valid checksums"

# ---------------------------------------------------------------------------
log "full stack (app running)"
if [ -z "$APP_IMAGE" ]; then
  skip "import with the app container running" "SNAPSHOT_TEST_APP_IMAGE not set"
elif ! docker image inspect "$APP_IMAGE" >/dev/null 2>&1; then
  fail "SNAPSHOT_TEST_APP_IMAGE '$APP_IMAGE' is not available locally"
else
  PORT=$(free_port)
  write_env "$APP" snapapp app-secret "$TMP/$APP.env" "FRONTEND_PORT=$PORT" "ADMIN_PASSWORD=Snaptest-Admin-1" "NODE_ENV=production" \
    "GENAI_URL=http://genai.invalid:8080" "KIT_SERVER_URL=http://kit.invalid:3090"
  mkdir -p "$TMP/$APP/upload" "$TMP/$APP/plugin" "$TMP/$APP/widgets"
  echo "widget" > "$TMP/$APP/widgets/w.js"
  # Extra overlay, like docker-compose.widgets.yml in real deployments: import must keep it.
  cat > "$TMP/app-overlay.yml" <<EOF
services:
  autowrx:
    image: $APP_IMAGE
    volumes:
      - '$TMP/$APP/widgets:/usr/src/playground-be/static/builtin-widgets'
EOF
  docker compose -p "$APP" -f "$COMPOSE_FILE" -f "$TMP/app-overlay.yml" --env-file "$TMP/$APP.env" \
    up -d --no-build --wait --wait-timeout 300 >/dev/null 2>&1 || {
      docker logs --tail 40 "$APP-autowrx" >&2 || true
      fail "full stack did not become healthy"; }
  ok "full stack started from the app image with an extra compose overlay" "$APP_IMAGE on port $PORT, app healthy (/v2/health/ready)"

  mongo "$APP" snapapp 'db.snaptest_marker.insertMany([{i:1},{i:2},{i:3}])' >/dev/null
  echo "marker" > "$TMP/$APP/upload/marker.txt"
  snap "$APP" export -y >/dev/null
  APP_BUNDLE=$(latest "$TMP/snapshots-$APP")
  tar -xOf "$APP_BUNDLE" manifest.json | python3 -c 'import json,sys; e=json.load(sys.stdin)["components"]["data"]["entries"]; assert e==["upload","plugin","builtin-widgets"], e' \
    || fail "app bundle does not contain upload, plugin and builtin-widgets"
  ok "export taken while the app is running" "$(basename "$APP_BUNDLE"); data roles upload, plugin, builtin-widgets"

  mongo "$APP" snapapp 'db.snaptest_marker.drop()' >/dev/null
  rm -f "$TMP/$APP/upload/marker.txt"
  echo "changed" > "$TMP/$APP/widgets/w.js"
  ID_BEFORE=$(docker inspect -f '{{.Id}}' "$APP-autowrx")
  STARTED_BEFORE=$(docker inspect -f '{{.State.StartedAt}}' "$APP-autowrx")
  snap "$APP" import "$APP_BUNDLE" -y > "$TMP/report/app-import.txt" 2>&1 || { cat "$TMP/report/app-import.txt" >&2; fail "import with the app running failed"; }
  grep -q "\[app\] stopping $APP-autowrx" "$TMP/report/app-import.txt" || fail "import did not stop the app"
  ok "import stops the app, restores, restarts it and waits for healthy" "$(grep -c . "$TMP/report/app-import.txt") log lines; see the import log below"

  [ "$(docker inspect -f '{{.State.Health.Status}}' "$APP-autowrx")" = "healthy" ] || fail "app not healthy after import"
  docker exec "$APP-autowrx" node src/healthcheck.js || fail "readiness probe fails after import"
  [ "$(docker inspect -f '{{.State.StartedAt}}' "$APP-autowrx")" != "$STARTED_BEFORE" ] || fail "app was not restarted"
  ok "app is healthy again after import and was restarted" "StartedAt changed, readiness probe returns 200"

  [ "$(docker inspect -f '{{.Id}}' "$APP-autowrx")" = "$ID_BEFORE" ] || fail "app container was recreated"
  docker inspect -f '{{range .Mounts}}{{.Destination}} {{end}}' "$APP-autowrx" | grep -q builtin-widgets || fail "overlay mount was dropped"
  ok "app container kept (not recreated) with its overlay mount" "same container ID; builtin-widgets mount from the overlay still present"

  [ "$(mongo "$APP" snapapp 'print(db.snaptest_marker.countDocuments({}))')" = "3" ] || fail "marker collection not restored"
  [ "$(cat "$TMP/$APP/upload/marker.txt" 2>/dev/null)" = "marker" ] || fail "marker upload not restored"
  [ "$(docker exec "$APP-autowrx" cat /usr/src/playground-be/static/uploads/marker.txt 2>/dev/null)" = "marker" ] \
    || fail "restarted app does not see the restored upload through its mount"
  [ "$(docker exec "$APP-autowrx" cat /usr/src/playground-be/static/builtin-widgets/w.js 2>/dev/null)" = "widget" ] \
    || fail "restarted app does not see the restored builtin-widgets through the overlay mount"
  ok "data written before the snapshot is back and visible to the restarted app" "snaptest_marker = 3 docs; upload/marker.txt and builtin-widgets/w.js read back from inside the app container"
fi
