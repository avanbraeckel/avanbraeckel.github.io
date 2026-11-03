#!/usr/bin/env bash
# Build a private copy of the site, so parallel agents (or a long build) never
# share site/.next and site/out with each other or with a running dev server.
#
# Usage: scripts/sandbox-build.sh <name>
#   → ~/.cache/avb-sandboxes/<name>/site/out   (serve it with: npx serve out -l <port>)
#   scripts/sandbox-build.sh --clean            removes every sandbox
#
# Each run re-copies the current site/ (in-progress edits included). Gotchas
# this works around: rsync isn't installed; Turbopack won't resolve a symlinked
# node_modules, so it is hard-linked instead (same disk as the repo, not /tmp,
# which is a RAM-backed tmpfs here).
set -euo pipefail

ROOT="$HOME/.cache/avb-sandboxes"
if [ "${1:-}" = "--clean" ]; then
  rm -rf "$ROOT"
  echo "removed $ROOT"
  exit 0
fi

NAME="${1:?usage: sandbox-build.sh <name> | --clean}"
SITE="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(dirname "$SITE")"
BOX="$ROOT/$NAME"

mkdir -p "$BOX/site"
# The build reads ../archive (images, Transient zip); link it, and any legacy
# folders that still exist, at the same relative paths.
for d in archive images assets; do # legacy-fallback: images, assets
  [ -e "$REPO/$d" ] && ln -sfn "$REPO/$d" "$BOX/$d"
done

find "$BOX/site" -mindepth 1 -maxdepth 1 ! -name .next ! -name node_modules -exec rm -rf {} +
tar -C "$SITE" --exclude=./node_modules --exclude=./.next --exclude=./out \
  --exclude=./.screenshots --exclude=./.a11y -cf - . | tar -C "$BOX/site" -xf -

[ -L "$BOX/site/node_modules" ] && rm "$BOX/site/node_modules"
[ -d "$BOX/site/node_modules" ] ||
  cp -al "$SITE/node_modules" "$BOX/site/node_modules" 2>/dev/null ||
  cp -a "$SITE/node_modules" "$BOX/site/node_modules"

cd "$BOX/site"
npm run build >"$BOX/build.log" 2>&1 || {
  tail -40 "$BOX/build.log"
  exit 1
}
echo "built: $BOX/site/out"
