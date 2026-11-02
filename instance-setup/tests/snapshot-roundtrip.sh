#!/usr/bin/env bash
# snapshot-roundtrip.sh — end-to-end check of ../snapshot.sh on scratch compose
# projects. Self-contained: creates two throwaway MongoDB-only projects from
# docker-compose.prod.yml (no app image build), runs export/inspect/import, and
# always tears everything down (containers, volumes, networks, temp dirs).
#
# Usage: instance-setup/tests/snapshot-roundtrip.sh
# Needs: docker (compose v2), python3, the mongo image used by docker-compose.prod.yml.

set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
SNAP="$HERE/../snapshot.sh"
COMPOSE_FILE="$HERE/../docker-compose.prod.yml"
TMP=$(mktemp -d)
SRC="snaptest-src-$$"
DST="snaptest-dst-$$"
PASS=0

log() { echo "--- $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { PASS=$((PASS + 1)); echo "ok $PASS - $*"; }

cleanup() {
  local rc=$?
  for p in "$SRC" "$DST"; do
    docker compose -p "$p" -f "$COMPOSE_FILE" --env-file "$TMP/$p.env" down -v --remove-orphans >/dev/null 2>&1 || true
  done
  # Restored data may be owned by another uid; remove via a container if needed
  rm -rf "$TMP" 2>/dev/null || docker run --rm --user 0 --entrypoint sh -v "$TMP:/t" mongo:7.0 -c 'rm -rf /t/* /t/.[!.]*' >/dev/null 2>&1 || true
  rm -rf "$TMP" 2>/dev/null || true
  if [ "$rc" -eq 0 ]; then echo "PASS ($PASS checks)"; else echo "FAILED (after $PASS passing checks)" >&2; fi
}
trap cleanup EXIT

write_env() { # write_env <project> <db> <jwt> <envfile>
  mkdir -p "$TMP/$1"
  cat > "$4" <<EOF
NAME=$1
MONGODB_DATABASE=$2
JWT_SECRET=$3
UPLOAD_PATH_HOST=$TMP/$1/upload
PLUGIN_PATH_HOST=$TMP/$1/plugin
CORS_ORIGINS=localhost
ADMIN_EMAILS=admin@example.com
EOF
}

up_db() { # up_db <project>
  docker compose -p "$1" -f "$COMPOSE_FILE" --env-file "$TMP/$1.env" up -d --wait --wait-timeout 120 autowrx-db >/dev/null 2>&1
}

snap() { # snap <project> <args...>  (runs snapshot.sh against that scratch project)
  local p=$1; shift
  SNAPSHOT_ENV_FILE="$TMP/$p.env" SNAPSHOT_COMPOSE_FILE="$COMPOSE_FILE" SNAPSHOT_PROJECT="$p" \
    SNAPSHOT_OUT_DIR="$TMP/snapshots-$p" "$SNAP" "$@"
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

# ---------------------------------------------------------------------------
log "setup: scratch projects $SRC, $DST"
write_env "$SRC" snapsrc same-secret "$TMP/$SRC.env"
write_env "$DST" snapdst same-secret "$TMP/$DST.env"
up_db "$SRC"

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

# ---------------------------------------------------------------------------
log "export + inspect"
snap "$SRC" export -y >/dev/null
BUNDLE=$(latest "$TMP/snapshots-$SRC")
[ -f "$BUNDLE" ] || fail "no bundle written"
ok "export wrote $(basename "$BUNDLE")"
INSPECT=$(snap "$SRC" inspect "$BUNDLE")
grep -q "Snapshot OK" <<<"$INSPECT" || fail "inspect did not validate the bundle"
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
ok "manifest is versioned, has counts/entries, and no secret"

# ---------------------------------------------------------------------------
log "mutate source"
mongo "$SRC" snapsrc 'db.models.drop(); db.users.insertOne({email:"late@x"}); db.extra.insertOne({x:1});' >/dev/null
rm "$TMP/$SRC/upload/a.txt"
echo "changed" > "$TMP/$SRC/plugin/p1/index.js"
echo "new" > "$TMP/$SRC/upload/new.txt"
MUTATED=$(state "$SRC" snapsrc)
[ "$MUTATED" != "$ORIG" ] || fail "mutation had no effect"

log "import --dry-run changes nothing"
DRY=$(snap "$SRC" import "$BUNDLE" --dry-run)
grep -q "Dry run: no changes made." <<<"$DRY" || fail "dry-run output missing marker"
grep -q "extra .*DROP" <<<"$DRY" || fail "dry-run plan does not show the collection to drop"
[ "$(state "$SRC" snapsrc)" = "$MUTATED" ] || fail "dry-run modified the instance"
[ ! -d "$TMP/snapshots-$SRC" ] || ! ls "$TMP/snapshots-$SRC" | grep -q pre-import || fail "dry-run wrote a safety snapshot"
ok "dry-run printed the plan and left the instance untouched"

log "import without -y aborts on a wrong confirmation"
if echo "not-the-name" | snap "$SRC" import "$BUNDLE" >/dev/null 2>&1; then fail "import proceeded without correct confirmation"; fi
[ "$(state "$SRC" snapsrc)" = "$MUTATED" ] || fail "aborted import modified the instance"
ok "wrong confirmation aborts with no changes"

log "same-instance import restores the snapshot"
echo "$SRC" | snap "$SRC" import "$BUNDLE" >/dev/null
[ "$(state "$SRC" snapsrc)" = "$ORIG" ] || { diff <(echo "$ORIG") <(state "$SRC" snapsrc) || true; fail "state after import differs from snapshot"; }
ok "typed confirmation + import restored DB (incl. indexes, dropped 'extra') and files exactly"
ls "$TMP/snapshots-$SRC" | grep -q pre-import || fail "no safety snapshot written"
ok "safety snapshot of the pre-import state was written"

# ---------------------------------------------------------------------------
log "cross-instance import into $DST (database snapsrc -> snapdst)"
up_db "$DST"
snap "$DST" import "$BUNDLE" -y >/dev/null
EXPECT_DST=$(sed "s#$SRC#$DST#g" <<<"$ORIG")
[ "$(state "$DST" snapdst | sed "s#$SRC#$DST#g")" = "$EXPECT_DST" ] || { diff <(echo "$EXPECT_DST") <(state "$DST" snapdst) || true; fail "cross-instance state differs"; }
[ "$(mongo "$DST" snapsrc 'print(db.getCollectionNames().length)')" = "0" ] || fail "source database name leaked into target"
ok "cross-instance import reproduced DB and data under the target's names"

# ---------------------------------------------------------------------------
log "safety checks"
write_env "$DST" snapdst other-secret "$TMP/$DST-mismatch.env"
if SNAPSHOT_ENV_FILE="$TMP/$DST-mismatch.env" SNAPSHOT_COMPOSE_FILE="$COMPOSE_FILE" SNAPSHOT_PROJECT="$DST" \
   SNAPSHOT_OUT_DIR="$TMP/snapshots-$DST" "$SNAP" import "$BUNDLE" -y >/dev/null 2>&1; then
  fail "import with a different JWT_SECRET was not refused under -y"
fi
ok "JWT_SECRET mismatch is refused under -y"

retar "$BUNDLE" "$TMP/tampered.tar" 'import sys; p=sys.argv[1]+"/data.tar.gz"; b=bytearray(open(p,"rb").read()); b[-20]^=0xff; open(p,"wb").write(b)'
if snap "$SRC" inspect "$TMP/tampered.tar" >/dev/null 2>&1; then fail "tampered bundle passed inspect"; fi
ok "tampered bundle is rejected (checksum)"

retar "$BUNDLE" "$TMP/future.tar" 'import sys,json; p=sys.argv[1]+"/manifest.json"; m=json.load(open(p)); m["formatVersion"]=99; json.dump(m,open(p,"w"))'
OUT=$(snap "$SRC" inspect "$TMP/future.tar" 2>&1 || true)
grep -q "newer than this script supports" <<<"$OUT" || fail "future formatVersion not refused: $OUT"
ok "newer formatVersion is refused"

retar "$BUNDLE" "$TMP/extra.tar" 'import sys; open(sys.argv[1]+"/evil.sh","w").write("x")'
if snap "$SRC" inspect "$TMP/extra.tar" >/dev/null 2>&1; then fail "bundle with unexpected member passed"; fi
ok "unexpected bundle member is rejected"
