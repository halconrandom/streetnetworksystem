#!/usr/bin/env bash
# Street Network Admin - Deploy Script
# Uso: ./deploy-sn.sh [--skip-build] [--skip-deps]

set -euo pipefail

# Configuración
REPO_DIR="/home/deployer/streetnetworksystem"
PM2_NAME="streetnetwork-admin"
PORT="3005"
BACKEND_PORT="8788"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parsear argumentos
SKIP_BUILD=false
SKIP_DEPS=false

for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --skip-deps) SKIP_DEPS=true ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Street Network Admin - Deploy         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"

cd "$REPO_DIR"

# ───────────────────────────────────────────────────────────
# 0. CLEANUP (fix common issues)
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[0/7]${NC} Cleaning up conflicts..."

# Fix next-env.d.ts merge conflicts
if [ -f "next-env.d.ts" ]; then
    git checkout --theirs next-env.d.ts 2>/dev/null || true
    git add next-env.d.ts 2>/dev/null || true
    echo -e "  ${GREEN}✓ Fixed next-env.d.ts${NC}"
fi

# Clear any merge state
if [ -d ".git/MERGE_HEAD" ] || [ -f ".git/MERGE_MSG" ]; then
    git reset --hard HEAD 2>/dev/null || true
    echo -e "  ${GREEN}✓ Cleared merge state${NC}"
fi

# Drop any stashes that might cause issues
git stash drop 2>/dev/null || true

# ───────────────────────────────────────────────────────────
# 1. GIT PULL
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/7]${NC} Pulling latest changes..."
git fetch --all --prune
git reset --hard origin/main
git pull --rebase
echo -e "  ${GREEN}✓ Git pull completed${NC}"

# ───────────────────────────────────────────────────────────
# 2. ENVIRONMENT SETUP
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/7]${NC} Setting up environment..."

if [ -f ".env.production" ]; then
    cp .env.production .env.local
    echo -e "  ${GREEN}✓ .env.production copied to .env.local${NC}"
else
    echo -e "  ${RED}✗ .env.production not found!${NC}"
    echo -e "  ${YELLOW}Create .env.production with your production keys${NC}"
fi

# ───────────────────────────────────────────────────────────
# 3. DEPENDENCIES
# ───────────────────────────────────────────────────────────
if [ "$SKIP_DEPS" = false ]; then
    echo -e "\n${YELLOW}[3/7]${NC} Installing dependencies..."
    npm install
    echo -e "  ${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "\n${YELLOW}[3/7]${NC} Skipping dependencies (--skip-deps)"
fi

# ───────────────────────────────────────────────────────────
# 4. BUILD
# ───────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
    echo -e "\n${YELLOW}[4/7]${NC} Building application..."
    npm run build
    echo -e "  ${GREEN}✓ Build completed${NC}"
else
    echo -e "\n${YELLOW}[4/7]${NC} Skipping build (--skip-build)"
fi

# ───────────────────────────────────────────────────────────
# 5. NGINX SETUP
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[5/7]${NC} Setting up nginx..."

if [ -f "nginx.conf" ]; then
    if [ ! -L "/etc/nginx/sites-enabled/streetnetwork" ]; then
        sudo ln -s "$REPO_DIR/nginx.conf" /etc/nginx/sites-enabled/streetnetwork
        echo -e "  ${GREEN}✓ Nginx symlink created${NC}"
    else
        echo -e "  ${GREEN}✓ Nginx symlink already exists${NC}"
    fi
    
    if sudo nginx -t > /dev/null 2>&1; then
        sudo systemctl reload nginx
        echo -e "  ${GREEN}✓ Nginx reloaded${NC}"
    else
        echo -e "  ${RED}✗ Nginx configuration error!${NC}"
        sudo nginx -t
        exit 1
    fi
else
    echo -e "  ${RED}✗ nginx.conf not found!${NC}"
    exit 1
fi

# ───────────────────────────────────────────────────────────
# 6. PM2 RESTART
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[6/7]${NC} Starting application with PM2..."

# Start Next.js app
if ! pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
    echo -e "  ${BLUE}Creating new PM2 process...${NC}"
    pm2 start npm --name "$PM2_NAME" -- start -- -p "$PORT"
    pm2 save
    echo -e "  ${GREEN}✓ PM2 process created and saved${NC}"
else
    echo -e "  ${BLUE}Restarting existing PM2 process...${NC}"
    pm2 restart "$PM2_NAME" --update-env
    echo -e "  ${GREEN}✓ PM2 process restarted${NC}"
fi

# Start CORS Proxy for Discord
PROXY_NAME="streetnetwork-proxy"
PROXY_PORT="8787"

if ! pm2 describe "$PROXY_NAME" > /dev/null 2>&1; then
    echo -e "  ${BLUE}Creating CORS Proxy process...${NC}"
    pm2 start proxy/corsProxy.mjs --name "$PROXY_NAME"
    pm2 save
    echo -e "  ${GREEN}✓ CORS Proxy created on port $PROXY_PORT${NC}"
else
    echo -e "  ${BLUE}Restarting CORS Proxy...${NC}"
    pm2 restart "$PROXY_NAME"
    echo -e "  ${GREEN}✓ CORS Proxy restarted${NC}"
fi

# ───────────────────────────────────────────────────────────
# 7. VERIFICATION
# ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[7/7]${NC} Verifying deployment..."

# Wait for app to start
sleep 3

# Check if app is responding
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200\|302\|304"; then
    echo -e "  ${GREEN}✓ Application responding on port $PORT${NC}"
else
    echo -e "  ${YELLOW}⚠ Application may still be starting...${NC}"
fi

# ───────────────────────────────────────────────────────────
# SUMMARY
# ───────────────────────────────────────────────────────────
echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deploy Completed!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  ${BLUE}App:${NC}     https://tmstreet.network"
echo -e "  ${BLUE}Port:${NC}    $PORT"
echo -e "  ${BLUE}PM2:${NC}     $PM2_NAME"
echo -e ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "    pm2 logs $PM2_NAME      # View logs"
echo -e "    pm2 restart $PM2_NAME   # Restart app"
echo -e "    pm2 stop $PM2_NAME      # Stop app"
echo -e ""

pm2 status