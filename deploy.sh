#!/bin/bash
set -e
export PATH="/c/Program Files/nodejs:$PATH"
cd /c/Users/rjcmi/blog

echo "=== Building Next.js ==="
npm run build

echo "=== Rebuilding for Netlify ==="
npx netlify-cli build

echo "=== Deploying ==="
npx netlify-cli deploy --prod

echo "=== Done ==="
echo "https://rjcmi-blog.netlify.app"
