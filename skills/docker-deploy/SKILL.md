---
name: docker-deploy
description: Use when containerizing applications, writing Dockerfiles, creating docker-compose configs, or setting up CI/CD deployment pipelines
---

# Docker & Deployment

## Overview

Containers should be small, secure, and reproducible.

**Core principle:** Immutable builds, minimal images, environment parity.

## Dockerfile Best Practices

### Multi-Stage Build (Node.js Example)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Rules

| ✅ Do | ❌ Don't |
|-------|----------|
| Use `alpine` or `slim` base images | Use full `ubuntu` / `node:latest` |
| `COPY package*.json` first (layer cache) | `COPY . .` before `npm install` |
| `npm ci` (deterministic) | `npm install` (non-deterministic) |
| `USER node` (non-root) | Run as root |
| Multi-stage builds | Single stage with dev deps |
| `.dockerignore` file | Copy `node_modules` / `.git` |
| Pin versions (`node:20.11-alpine`) | Use `latest` tag |
| `HEALTHCHECK` instruction | No health checks |

### .dockerignore

```
node_modules
.git
.env
*.md
.github
coverage
dist
```

## Docker Compose

### Production Template

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

### Key Rules

- Always use `depends_on` with `condition: service_healthy`
- Use `restart: unless-stopped` for production
- Set resource `limits`
- Use named `volumes` for persistent data
- Use `.env` file for secrets (never hardcode)
- Use `${VAR:-default}` syntax for defaults

## CI/CD Pipeline (GitHub Actions)

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t app:${{ github.sha }} .

      - name: Run tests
        run: docker run --rm app:${{ github.sha }} npm test

      - name: Push to registry
        run: |
          docker tag app:${{ github.sha }} $REGISTRY/app:${{ github.sha }}
          docker tag app:${{ github.sha }} $REGISTRY/app:latest
          docker push $REGISTRY/app --all-tags
```

## Deployment Checklist

- [ ] Dockerfile uses multi-stage build
- [ ] Image runs as non-root user
- [ ] Health check configured
- [ ] `.dockerignore` exists and is complete
- [ ] No secrets baked into image
- [ ] Environment variables for all config
- [ ] Resource limits set
- [ ] Logging to stdout/stderr (not files)
- [ ] Graceful shutdown handles SIGTERM
- [ ] Image scanned for vulnerabilities (`docker scout`, `trivy`)

## Common Image Size Reduction

| Technique | Typical Savings |
|-----------|----------------|
| `alpine` base | 500MB → 50MB |
| Multi-stage build | Remove dev deps, build tools |
| `.dockerignore` | Exclude `.git`, `node_modules`, docs |
| `npm ci --only=production` | No dev dependencies |
| Pin + minimal layers | Better cache, smaller diff |
