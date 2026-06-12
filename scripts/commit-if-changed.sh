#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/commit-if-changed.sh <commit-message> <path> [<path>...]
# Commits staged changes if any of the given paths have modifications.

message="${1:?Usage: commit-if-changed.sh <commit-message> <path> [<path>...]}"
shift
paths=("$@")

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

vp check --fix "${paths[@]}"
git add "${paths[@]}"

if git diff --cached --quiet; then
  echo "No changes to commit"
else
  git commit --no-verify -m "$message"
  git push
fi
