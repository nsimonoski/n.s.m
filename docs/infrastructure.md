# Infrastructure

## Hosting

- **Server**: Hetzner Cloud CX22 (2 vCPU, 4GB RAM, Ubuntu 24.04)
- **Domain**: kod3.dev (Cloudflare DNS)
- **SSL**: Let's Encrypt (auto-renewed via Certbot)

## Architecture

```
                   kod3.dev
                      |
                  [ Nginx ]
                 /    |    \
   /ang/*       /api/*      /rct/*
      |            |            |
 Angular SPA   NestJS API   React SPA
 (static)     (Docker)      (static)
                   |
                 Redis
```

## Stack

| Layer | Technology |
|-------|-----------|
| Reverse Proxy | Nginx |
| Frontend (Angular) | Served as static files at `/ang/` |
| Frontend (React) | Served as static files at `/rct/` |
| Backend API | NestJS (Node.js), served at `/api/` |
| WebSockets | Socket.IO, proxied via Nginx |
| Session Store | Redis |
| Containerization | Docker Compose |
| CI/CD | GitHub Actions |
| Authentication | GitHub OAuth |

## Deployment

- **Automatic**: Push to `dev` branch triggers GitHub Actions deploy
- **Manual**: `./deploy/deploy.sh` from local machine

Both methods build the Angular frontend and NestJS API, upload to the server via rsync, and restart Docker containers.
