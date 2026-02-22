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

echo "[deploy] Installing deps..."
npm install

echo "[deploy] Building..."
npm run build

echo "[deploy] Restarting PM2..."
pm2 restart "$PM2_NAME" --update-env

if [ "$STASHED" -eq 1 ]; then
  echo "[deploy] Re-applying stashed changes..."
  git stash pop || true
fi

echo "[deploy] Done."