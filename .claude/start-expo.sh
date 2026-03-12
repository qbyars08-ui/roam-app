#!/bin/bash
export PATH="/Users/quinnbyars/.nvm/versions/node/v20.20.1/bin:$PATH"
cd "$(dirname "$0")/.." || exit 1
exec npx expo start --web --port "${PORT:-8081}" --clear
