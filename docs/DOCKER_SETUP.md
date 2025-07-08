# Docker Development Setup

This guide explains how to set up and run the Web Crawler application using Docker for development.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

## Quick Start

1. **Start the development environment:**
   ```bash
   ./scripts/dev-start.sh
   ```

2. **Access the services:**
   - **Backend API**: http://localhost:8080
   - **API Health Check**: http://localhost:8080/health
   - **Database Admin (Adminer)**: http://localhost:8081
   - **Database**: localhost:3306

3. **Stop the environment:**
   ```bash
   ./scripts/dev-stop.sh
   ```

## Services

### Backend API (Port 8080)
- **Hot reload enabled** - Changes to Go files automatically restart the server
- **Debug mode** - Detailed logging and error information
- **Automatic migrations** - Database schema is created/updated on startup

### MySQL Database (Port 3306)
- **Database**: `web_crawler`
- **Username**: `crawler_user`
- **Password**: `crawler_password`
- **Root Password**: `rootpassword`

### Adminer (Port 8081)
- Web-based database administration tool
- Pre-configured to connect to MySQL
- Useful for viewing data and debugging

## Development Workflow

### Starting Development
```bash
# Start all services
./scripts/dev-start.sh

# View backend logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f
```

### Making Code Changes
- Edit files in the `backend/` directory
- Changes are automatically detected and the server restarts
- No need to rebuild Docker images for code changes

### Database Operations
```bash
# Reset database (destroys all data)
./scripts/dev-reset-db.sh

# Access MySQL CLI
docker-compose exec mysql mysql -u crawler_user -p web_crawler

# Backup database
docker-compose exec mysql mysqldump -u crawler_user -p web_crawler > backup.sql

# Restore database
docker-compose exec -i mysql mysql -u crawler_user -p web_crawler < backup.sql
```

### Docker Management
```bash
# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild backend image
docker-compose build backend

# Pull latest images
docker-compose pull

# View running containers
docker-compose ps

# View resource usage
docker stats
```

## Environment Variables

The following environment variables are configured for development:

```bash
DB_HOST=mysql
DB_PORT=3306
DB_USER=crawler_user
DB_PASSWORD=crawler_password
DB_NAME=web_crawler
JWT_SECRET=dev-jwt-secret-key-change-this
SERVER_PORT=8080
GIN_MODE=debug
```

## Troubleshooting

### Port Conflicts
If you get port conflict errors:
```bash
# Check what's using the ports
lsof -i :8080
lsof -i :3306
lsof -i :8081

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost

# View MySQL logs
docker-compose logs mysql

# Reset database completely
./scripts/dev-reset-db.sh
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend image
docker-compose build --no-cache backend

# Restart just the backend
docker-compose restart backend
```

### Hot Reload Not Working
```bash
# Check if volume mount is working
docker-compose exec backend ls -la /app

# Restart backend service
docker-compose restart backend

# Check Air logs
docker-compose exec backend cat build-errors.log
```

## API Testing

### Test Endpoints
```bash
# Health check
curl http://localhost:8080/health

# Register a user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Start a crawl (replace TOKEN with login response)
curl -X POST http://localhost:8080/api/v1/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"url":"https://example.com"}'
```

### WebSocket Testing
You can test WebSocket connections using browser developer tools or tools like [wscat](https://github.com/websockets/wscat):

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080/ws
```

## Performance Monitoring

```bash
# View container resource usage
docker stats

# View Docker system usage
docker system df

# Clean up unused Docker resources
docker system prune
```

## Development Tips

1. **Use Adminer** for database inspection and debugging
2. **Monitor logs** with `docker-compose logs -f backend`
3. **Hot reload** means you don't need to restart containers for code changes
4. **Reset database** when testing migration changes
5. **Use health check** endpoint to verify backend is running correctly

## File Structure

```
web-crawler/
├── docker-compose.yml          # Main development configuration
├── docker/
│   ├── backend/
│   │   ├── Dockerfile.dev      # Development backend image
│   │   └── .air.toml          # Hot reload configuration
│   └── mysql/
│       └── init.sql           # Database initialization
├── scripts/
│   ├── dev-start.sh          # Start development environment
│   ├── dev-stop.sh           # Stop development environment
│   └── dev-reset-db.sh       # Reset database
└── backend/                   # Go application code
``` 