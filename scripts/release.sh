#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ELECTRON_DIR="$ROOT_DIR/electron"

LEVEL="${1:-patch}"

if [[ "$LEVEL" != "patch" && "$LEVEL" != "minor" && "$LEVEL" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

# Check working tree is clean
if ! git -C "$ROOT_DIR" diff --quiet HEAD 2>/dev/null || \
   ! git -C "$ROOT_DIR" diff --cached --quiet 2>/dev/null; then
  echo "Error: working tree has uncommitted changes. Commit or stash first."
  exit 1
fi

# Build frontend
echo ">>> Building frontend..."
cd "$ROOT_DIR/web"
npm run build

# Read current version
cd "$ELECTRON_DIR"
CURRENT=$(node -p "require('./package.json').version")
echo ">>> Current version: $CURRENT"

# Bump version (modifies package.json + package-lock.json, commits, tags)
echo ">>> Bumping $LEVEL version..."
npm version "$LEVEL" -m "v%s"

# Amend the version commit to include web-dist changes
NEW_VERSION=$(node -p "require('./package.json').version")
echo ">>> New version: $NEW_VERSION"

if git -C "$ROOT_DIR" diff --quiet HEAD -- electron/web-dist/ 2>/dev/null; then
  echo ">>> web-dist unchanged, no amend needed."
else
  echo ">>> Amending commit to include web-dist changes..."
  cd "$ROOT_DIR"
  git add electron/web-dist/
  git commit --amend --no-edit
fi

echo ""
echo ">>> Release v$NEW_VERSION ready!"
echo "    Tag: v$NEW_VERSION"
echo ""
echo "    Push to trigger CI:"
echo "      git push && git push --tags"
