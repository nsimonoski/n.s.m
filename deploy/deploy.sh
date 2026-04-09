#!/bin/bash
set -e

SERVER="${DEPLOY_USER:-deploy}@${DEPLOY_HOST:?DEPLOY_HOST is required}"
DOMAIN="${DEPLOY_DOMAIN:-kod3.dev}"

# Parse arguments
UAT=false
for arg in "$@"; do
  case $arg in
    --uat) UAT=true ;;
  esac
done

if [ "$UAT" = true ]; then
  DEPLOY_DIR="/opt/kode-uat"
  ANGULAR_PATH="/var/www/$DOMAIN/uat/angular/"
  REACT_PATH="/var/www/$DOMAIN/uat/react/"
  COMPOSE_FILE="docker-compose.uat.yml"
  ANGULAR_EXTRA_ARGS="--base-href /uat/angular/"
  export VITE_BASE="/uat/react/"
  ENV_FILE=".env.uat.production"
  echo "=== Deploying to UAT environment ==="
else
  DEPLOY_DIR="/opt/kode"
  ANGULAR_PATH="/var/www/$DOMAIN/angular/"
  REACT_PATH="/var/www/$DOMAIN/react/"
  COMPOSE_FILE="docker-compose.yml"
  ANGULAR_EXTRA_ARGS=""
  ENV_FILE=".env.production"
  echo "=== Deploying to Production environment ==="
fi

echo "=== Building Angular ==="
npx nx build angular-ide --configuration=production $ANGULAR_EXTRA_ARGS

echo "=== Building React ==="
npx nx build react-ide

echo "=== Building NestJS API ==="
npx nx build nestjs-api

echo "=== Uploading Angular to server ==="
rsync -avz --no-owner --no-group --delete dist/apps/angular-ide/browser/ "$SERVER:$ANGULAR_PATH"

echo "=== Uploading React to server ==="
rsync -avz --no-owner --no-group --delete apps/react-ide/dist/ "$SERVER:$REACT_PATH"

echo "=== Uploading API + Docker files to server ==="
rsync -avz --no-owner --no-group apps/nestjs-api/dist/main.js apps/nestjs-api/dist/package.json "$SERVER:$DEPLOY_DIR/"
rsync -avz --no-owner --no-group Dockerfile "$COMPOSE_FILE" "$SERVER:$DEPLOY_DIR/"
if [ "$UAT" = true ]; then
  ssh "$SERVER" "mv $DEPLOY_DIR/docker-compose.uat.yml $DEPLOY_DIR/docker-compose.yml"
fi
rsync -avz --no-owner --no-group docker/workspace/Dockerfile docker/workspace/entrypoint.sh "$SERVER:$DEPLOY_DIR/docker/workspace/"

echo "=== Creating workspace directory on server ==="
ssh "$SERVER" "mkdir -p $DEPLOY_DIR/workspaces $DEPLOY_DIR/docker/workspace"

echo "=== Building workspace image ==="
ssh "$SERVER" "cd $DEPLOY_DIR && docker build -t nsm-workspace:latest -f docker/workspace/Dockerfile ."

echo "=== Building and starting API on server ==="
ssh "$SERVER" "cd $DEPLOY_DIR && docker compose up -d --build"

echo "=== Done! ==="
if [ "$UAT" = true ]; then
  echo "Visit https://$DOMAIN/uat/angular/"
  echo "Visit https://$DOMAIN/uat/react/"
else
  echo "Visit https://$DOMAIN/angular/"
  echo "Visit https://$DOMAIN/react/"
fi
