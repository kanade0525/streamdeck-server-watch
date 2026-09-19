#!/bin/sh
# Marketplace へ「修正版」を出すための配布物を作る。
#
# 却下された版を直して出し直すときは、**同じ版番号のまま**上げる決まりになっている
# （上げた版を出したい場合は、修正版ではなく新しい版として作る）。
# 手元の版が先に進んでいても、提出用だけ版番号を戻して包む必要がある。
#
#   sh scripts/pack-submission.sh 0.1.0.0
#
# 中身は現在のソースのまま。manifest の Version だけ差し替えて包み、すぐ元に戻す。

set -e
cd "$(dirname "$0")/.."

VERSION="$1"
[ -n "$VERSION" ] || { echo "使い方: sh scripts/pack-submission.sh <版番号>  例) 0.1.0.0"; exit 1; }

PLUGIN=com.kanade0525.serverwatch.sdPlugin
MANIFEST="$PLUGIN/manifest.json"
BACKUP="$(mktemp)"
cp "$MANIFEST" "$BACKUP"
# 何があっても manifest を元に戻す
trap 'cp "$BACKUP" "$MANIFEST"; rm -f "$BACKUP"' EXIT

python3 - "$MANIFEST" "$VERSION" <<'PY'
import json, sys, collections
path, version = sys.argv[1], sys.argv[2]
m = json.load(open(path), object_pairs_hook=collections.OrderedDict)
was = m['Version']
m['Version'] = version
json.dump(m, open(path, 'w'), ensure_ascii=False, indent=2)
print(f'提出用に版番号を {was} → {version} にした（包んだ後に戻す）')
PY

(cd "$PLUGIN" && npm install --omit=dev >/dev/null 2>&1)
npx --yes @elgato/cli@latest validate "$PLUGIN"
npx --yes @elgato/cli@latest pack "$PLUGIN" --output . --force

echo
echo "提出用の配布物:"
ls -la ./*.streamDeckPlugin
