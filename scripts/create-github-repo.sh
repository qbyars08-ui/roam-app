#!/usr/bin/env bash
# Run this script from the repo root (roam/) to create the GitHub repo and push.
# Requires: gh CLI installed and authenticated (brew install gh && gh auth login)

set -e
cd "$(dirname "$0")/.."

if ! command -v gh &>/dev/null; then
  echo "GitHub CLI (gh) not found. Install with: brew install gh"
  echo "Then run: gh auth login"
  exit 1
fi

gh repo create roam-app --private --source=. --remote=origin --push
echo "Done. Verify with: git log --oneline -5 && git remote -v"
