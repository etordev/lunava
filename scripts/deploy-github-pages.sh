#!/usr/bin/env bash
# Build production bundle and copy to a temp folder ready for the gh-pages branch.
# Usage: from repo root: ./scripts/deploy-github-pages.sh
# Then follow the printed git commands (requires push access to origin).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build:prod

SRC="$ROOT/dist/lunare/browser"
if [[ ! -d "$SRC" ]]; then
  echo "Expected build output not found: $SRC"
  exit 1
fi

DEST="$(mktemp -d)"
cp -a "$SRC"/. "$DEST/"
echo ""
echo "Production build copied to:"
echo "  $DEST"
echo ""
echo "Publish to GitHub Pages (gh-pages branch at repo root):"
echo "  cd $ROOT"
echo "  git fetch origin gh-pages && git checkout gh-pages"
echo "  rsync -a --delete --exclude .git \"$DEST\"/ ."
echo "  git add -A && git status"
echo "  git commit -m \"Deploy Lunare ($(date -u +%Y-%m-%d))\""
echo "  git push origin gh-pages"
echo "  git checkout main"
echo ""
echo "Or use a second clone/worktree checked out to gh-pages and rsync --delete from:"
echo "  $DEST"
