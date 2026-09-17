#!/bin/sh
# 配布用の .streamDeckPlugin を作る。
set -e
cd "$(dirname "$0")/.."
(cd com.kanade0525.serverwatch.sdPlugin && npm install --omit=dev)
npx --yes @elgato/cli@latest pack com.kanade0525.serverwatch.sdPlugin --output . --force
echo "できた:"
ls -la *.streamDeckPlugin
