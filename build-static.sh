#!/bin/bash
# Build script for static export deployment
# Temporarily moves admin/api routes out, builds, moves back

set -e
export PATH="/c/Program Files/nodejs:$PATH"

echo "=== Moving API & admin routes out ==="
mv app/api app/api.bak 2>/dev/null || true
mv app/admin app/admin.bak 2>/dev/null || true

echo "=== Building static site ==="
STATIC_EXPORT=1 npm run build

echo "=== Restoring routes ==="
mv app/api.bak app/api 2>/dev/null || true
mv app/admin.bak app/admin 2>/dev/null || true

echo "=== Done! Static site in out/ ==="
