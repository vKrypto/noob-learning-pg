#!/usr/bin/env bash
# Rebuild js/vendor/firebase.js from the official "firebase" npm package.
# Usage: bash tools/build-firebase.sh [version]   (default: latest)
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${1:-latest}"
TMP="$(mktemp -d)"
cp tools/firebase-entry.js "$TMP/entry.js"
( cd "$TMP" && npm init -y >/dev/null && npm install --silent "firebase@$VERSION" esbuild >/dev/null )
REAL="$(node -p "require('$TMP/node_modules/firebase/package.json').version")"
"$TMP/node_modules/.bin/esbuild" "$TMP/entry.js" --bundle --format=esm --minify --target=es2020 \
  --legal-comments=none --banner:js="/* Firebase JS SDK v$REAL (Apache-2.0) — bundled by tools/build-firebase.sh */" \
  --outfile=js/vendor/firebase.js
rm -rf "$TMP"
echo "Built js/vendor/firebase.js from firebase@$REAL ($(du -h js/vendor/firebase.js | cut -f1))"
