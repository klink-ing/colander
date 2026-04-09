#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/commit-if-changed.sh <path> <commit-message>
# Commits staged changes if the given path has modifications.

path="${1:?Usage: commit-if-changed.sh <path> <commit-message>}"
message="${2:?Usage: commit-if-changed.sh <path> <commit-message>}"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

if git diff --quiet "$path"; then
  echo "No changes in $path"
else
  git add "$path"
  git commit --no-verify -m "$message"
  git push
fi
