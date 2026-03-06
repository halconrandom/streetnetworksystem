#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/deployer/streetnetworksystem"
PM2_NAME="streetnetwork-admin"
PORT="3005"

cd "$REPO_DIR"

echo "[deploy] Pulling latest changes..."
git fetch --all --prune

# Preserve local changes if any
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy] Stashing local changes..."
  git stash push -u -m "deploy-stash $(date -u +%Y%m%d%H%M%S)"
  STASHED=1
else
  STASHED=0
fi

git pull --rebase

# Copy production env if exists
if [ -f ".env.production" ]; then
  echo "[deploy] Copying .env.production to .env.local..."
  cp .env.production .env.local
fi

# Setup nginx symlink if not exists
if [ -f "nginx.conf" ] && [ ! -L "/etc/nginx/sites-enabled/streetnetwork" ]; then
  echo "[deploy] Setting up nginx symlink..."
  sudo rm -f /etc/nginx/sites-enabled/streetnetwork
  sudo ln -s "$REPO_DIR/nginx.conf" /etc/nginx/sites-enabled/streetnetwork
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "[deploy] Installing deps..."
npm install

echo "[deploy] Building..."
npm run build

# Check if PM2 process exists, if not create it
if ! pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  echo "[deploy] Creating PM2 process..."
  pm2 start npm --name "$PM2_NAME" -- start -- -p "$PORT"
  pm2 save
else
  echo "[deploy] Restarting PM2..."
  pm2 restart "$PM2_NAME" --update-env
fi

if [ "$STASHED" -eq 1 ]; then
  echo "[deploy] Re-applying stashed changes..."
  git stash pop || true
fi

echo "[deploy] Done."
echo "[deploy] App running on port $PORT"
pm2 status