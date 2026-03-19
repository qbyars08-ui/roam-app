#!/usr/bin/env bash
# Add all EXPO_PUBLIC_* from .env to Vercel production. Run from repo root: ./scripts/add-vercel-env.sh
set -e
cd "$(dirname "$0")/.."
while IFS= read -r line; do
  key="${line%%=*}"
  value="${line#*=}"
  printf '%s' "$value" | npx vercel env add "$key" production
done < <(grep -E '^EXPO_PUBLIC_[A-Za-z0-9_]+=' .env)
