#!/bin/bash
# path: scripts/deploy.sh
# Deploy script untuk Beasiswa IAIN
# Usage: bash scripts/deploy.sh

set -e

echo "🚀 Deploy Beasiswa IAIN..."

# 1. Remove main field for build (save original)
MAIN_LINE=$(grep '"main":' wrangler.jsonc || true)
if [ -n "$MAIN_LINE" ]; then
  sed -i '/"main":/d' wrangler.jsonc
fi

# 2. Build
echo "📦 Building..."
pnpm build

# 3. Restore main field
if [ -n "$MAIN_LINE" ]; then
  # Add main field back after first {
  sed -i '1a\\t"main": "dist/_worker.js/index.js",' wrangler.jsonc
fi

# 4. Add .assetsignore
echo "_worker.js" > dist/.assetsignore

# 5. Deploy
echo "☁️ Deploying to Cloudflare Workers..."
CLOUDFLARE_ACCOUNT_ID=3dcd27778ee984c1b4b6539fa2a805d3 npx wrangler deploy

echo "✅ Deploy selesai!"
echo "🌐 https://beasiswa.iainptk.ac.id"
