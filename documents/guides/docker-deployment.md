# Docker Deployment Guide - Pocket Ranger

## Overview

This guide provides step-by-step instructions for deploying Pocket Ranger using Docker containers, including development, staging, and production environments.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher
- Node.js 18 or higher (for local development)
- 2GB RAM minimum for container deployment

## Docker Configuration

### Dockerfile (Multi-stage Build)

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY expo-install.* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build:web

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/api/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### Docker Compose Configuration

#### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  pocket-ranger-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    ports:
      - "8081:8081"
    environment:
      - NODE_ENV=development
      - EXPO_PUBLIC_API_URL=http://localhost:8081
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add Firebase emulator for local development
  firebase-emulator:
    image: firebase/firebase-tools:latest
    ports:
      - "9099:9099"  # Auth emulator
      - "8080:8080"  # Firestore emulator
      - "4000:4000"  # Emulator UI
    volumes:
      - ./firebase.json:/firebase.json
      - ./.firebaserc:/.firebaserc
    command: firebase emulators:start --only auth,firestore
```

#### Production Environment

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  pocket-ranger-app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "80:8081"
    environment:
      - NODE_ENV=production
      - EXPO_PUBLIC_API_URL=https://api.pocketranger.app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pocket-ranger.rule=Host(`pocketranger.app`)"
      - "traefik.http.routers.pocket-ranger.tls=true"
      - "traefik.http.routers.pocket-ranger.tls.certresolver=letsencrypt"

  # Reverse proxy for SSL termination
  traefik:
    image: traefik:v2.10
    command:
      - --api.dashboard=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --providers.docker=true
      - --certificatesresolvers.letsencrypt.acme.email=admin@pocketranger.app
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    restart: unless-stopped

volumes:
  letsencrypt:
```

## Deployment Instructions

### 1. Local Development Deployment

```bash
# Clone the repository
git clone <repository-url>
cd pocket-ranger-app

# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access the application
open http://localhost:8081
```

### 2. Production Deployment

```bash
# Build production image
docker build -t pocket-ranger:latest .

# Run production container
docker run -d \
  --name pocket-ranger-prod \
  -p 80:8081 \
  -e NODE_ENV=production \
  -e EXPO_PUBLIC_API_URL=https://api.pocketranger.app \
  --restart unless-stopped \
  pocket-ranger:latest

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Staging Environment

```bash
# Create staging-specific compose file
cp docker-compose.prod.yml docker-compose.staging.yml

# Modify environment variables for staging
# Then deploy
docker-compose -f docker-compose.staging.yml up -d
```

## Environment Variables

### Required Environment Variables

```bash
# Application
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.pocketranger.app

# Firebase (if using authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Optional
PORT=8081
LOG_LEVEL=info
```

### Environment File Example

```bash
# .env.production
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.pocketranger.app
PORT=8081
LOG_LEVEL=info

# Firebase Configuration
FIREBASE_PROJECT_ID=pocket-ranger-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@pocket-ranger-prod.iam.gserviceaccount.com
```

## Container Optimization

### Image Size Optimization

```dockerfile
# Multi-stage build reduces final image size
FROM node:18-alpine AS builder
# ... build stage

FROM node:18-alpine AS production
# Only production dependencies and built files
```

### Performance Tuning

```bash
# Limit container resources
docker run -d \
  --name pocket-ranger \
  --memory="512m" \
  --cpus="0.5" \
  -p 80:8081 \
  pocket-ranger:latest
```

### Docker Compose Resource Limits

```yaml
services:
  pocket-ranger-app:
    # ... other configuration
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## Monitoring and Logging

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check logs
docker inspect --format='{{.State.Health.Status}}' pocket-ranger-prod
```

### Log Management

```bash
# View application logs
docker logs -f pocket-ranger-prod

# Configure log rotation
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  pocket-ranger:latest
```

### Docker Compose Logging

```yaml
services:
  pocket-ranger-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Security Considerations

### Container Security

```dockerfile
# Use non-root user
USER nextjs

# Remove unnecessary packages
RUN apk del .build-deps

# Set proper file permissions
COPY --chown=nextjs:nodejs . .
```

### Network Security

```yaml
# Create isolated network
networks:
  pocket-ranger-network:
    driver: bridge

services:
  pocket-ranger-app:
    networks:
      - pocket-ranger-network
```

### Secrets Management

```bash
# Use Docker secrets for sensitive data
echo "your-secret-key" | docker secret create firebase-key -

# Reference in compose file
services:
  pocket-ranger-app:
    secrets:
      - firebase-key
```

## Backup and Recovery

### Database Backup (if using persistent storage)

```bash
# Backup volumes
docker run --rm -v pocket-ranger_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data

# Restore from backup
docker run --rm -v pocket-ranger_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

### Container State Backup

```bash
# Export container
docker export pocket-ranger-prod > pocket-ranger-backup.tar

# Import container
docker import pocket-ranger-backup.tar pocket-ranger:backup
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker logs pocket-ranger-prod
   docker inspect pocket-ranger-prod
   ```

2. **Health check failing**
   ```bash
   docker exec pocket-ranger-prod curl -f http://localhost:8081/api/health
   ```

3. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :8081
   
   # Use different port
   docker run -p 8082:8081 pocket-ranger:latest
   ```

4. **Memory issues**
   ```bash
   # Monitor resource usage
   docker stats pocket-ranger-prod
   
   # Increase memory limit
   docker update --memory 1g pocket-ranger-prod
   ```

### Debug Mode

```bash
# Run with debug shell
docker run -it --rm \
  -v $(pwd):/app \
  node:18-alpine \
  sh

# Or debug running container
docker exec -it pocket-ranger-prod sh
```

## Scaling and Load Balancing

### Multiple Container Instances

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  pocket-ranger-app:
    build: .
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.pocket-ranger.loadbalancer.server.port=8081"

  traefik:
    image: traefik:v2.10
    # ... configuration
```

### Horizontal Scaling

```bash
# Scale up
docker-compose -f docker-compose.scale.yml up --scale pocket-ranger-app=5

# Scale down
docker-compose -f docker-compose.scale.yml up --scale pocket-ranger-app=2
```

## Continuous Integration

### Docker Build in CI/CD

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t pocket-ranger:${{ github.sha }} .
      
      - name: Run tests
        run: docker run --rm pocket-ranger:${{ github.sha }} npm test
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push pocket-ranger:${{ github.sha }}
```

## Next Steps

After successful Docker deployment, consider:

1. **Kubernetes Deployment**: See [Kubernetes Deployment Guide](./k8s-deployment.md)
2. **Cloud Deployment**: See [Cloud Platform Guides](./cloud-deployment.md)
3. **Monitoring Setup**: Implement comprehensive monitoring and alerting
4. **Backup Strategy**: Set up automated backups and disaster recovery
5. **Security Hardening**: Regular security audits and updates

For additional support, refer to the [Architecture Documentation](../architecture/system-overview.md) or create an issue in the project repository.