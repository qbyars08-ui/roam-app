#!/usr/bin/env bash
# Deploy roamapp.app — run from roam/
set -e
echo "Exporting web..."
npx expo export --platform web
echo "/*    /index.html   200" > dist/_redirects
echo "Deploying to Netlify..."
netlify deploy --prod --dir=dist
echo "Done."
