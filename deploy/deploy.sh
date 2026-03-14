#!/bin/bash
set -e

SERVER="root@204.168.150.34"
DOMAIN="kod3.dev"

echo "=== Building Angular ==="
npx nx build angular-ide --configuration=production

echo "=== Building NestJS API ==="
npx nx build nestjs-api

echo "=== Uploading Angular to server ==="
rsync -avz --delete dist/apps/angular-ide/browser/ "$SERVER:/var/www/$DOMAIN/angular/"

echo "=== Uploading API + Docker files to server ==="
rsync -avz apps/nestjs-api/dist/main.js apps/nestjs-api/dist/package.json "$SERVER:/opt/kode/"
rsync -avz Dockerfile docker-compose.yml "$SERVER:/opt/kode/"

echo "=== Building and starting API on server ==="
ssh "$SERVER" "cd /opt/kode && docker compose up -d --build"

echo "=== Done! ==="
echo "Visit https://$DOMAIN/angular/"
