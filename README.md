# Web Crawler Application

A progressive web crawler application built with Go (Gin) backend and React frontend.

## Features

- **Progressive Web Crawling**: Crawl websites with real-time progress tracking
- **Start/Stop Control**: Ability to start and stop crawling tasks
- **Queue System**: Handle multiple crawling tasks in queue
- **Real-time Updates**: WebSocket-based status updates
- **Authentication**: JWT-based authentication system
- **Comprehensive Analysis**: 
  - HTML version detection
  - Page title extraction
  - Heading tag counts (H1, H2, etc.)
  - Internal vs external link analysis
  - Broken link detection (4xx/5xx)
  - Login form presence detection

## Quick Start with Docker (Recommended)

The easiest way to get started is using Docker:

```bash
# Start the development environment
./scripts/dev-start.sh

# Access the application
# - Backend API: http://localhost:8080
# - Database Admin: http://localhost:8081
```

For detailed Docker setup instructions, see [Docker Setup Guide](docs/DOCKER_SETUP.md).

## Project Structure

```
web-crawler/
├── backend/                 # Go backend application
│   ├── cmd/                # Application entry points
│   ├── internal/           # Private application code
│   │   ├── api/           # API handlers
│   │   ├── auth/          # Authentication logic
│   │   ├── crawler/       # Web crawling logic
│   │   ├── db/            # Database models and migrations
│   │   ├── middleware/    # HTTP middleware
│   │   ├── queue/         # Task queue system
│   │   └── websocket/     # WebSocket handlers
│   ├── pkg/               # Public packages
│   ├── migrations/        # Database migrations
│   └── config/            # Configuration files
├── frontend/              # React frontend application (Future)
├── docker/                # Docker configuration
├── scripts/               # Development scripts
└── docs/                  # Documentation
```

## Technology Stack

### Backend
- **Go 1.21+** - Primary backend language
- **Gin** - HTTP web framework
- **MySQL** - Database
- **JWT** - Authentication
- **WebSockets** - Real-time communication
- **Docker** - Containerization

### Frontend (Future)
- **React** - Frontend framework
- **WebSocket** - Real-time updates
- **Material-UI** - UI components

## Manual Setup (Alternative)

If you prefer not to use Docker:

### Prerequisites
- Go 1.21 or higher
- MySQL 8.0 or higher

### Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `go mod download`
3. Set up database and run migrations
4. Start the server: `go run cmd/main.go`

### Environment Variables
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=web_crawler
JWT_SECRET=your-secret-key
SERVER_PORT=8080
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh

### User Management
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

### Crawling
- `POST /api/v1/crawl` - Start crawling task
- `GET /api/v1/crawl` - Get user's crawling tasks
- `GET /api/v1/crawl/:id` - Get crawling status
- `PUT /api/v1/crawl/:id/stop` - Stop crawling task
- `GET /api/v1/crawl/:id/results` - Get crawling results
- `DELETE /api/v1/crawl/:id` - Delete crawling task

### Real-time
- `WebSocket /ws` - Real-time updates

## Development

### Using Docker (Recommended)
```bash
# Start development environment
./scripts/dev-start.sh

# View logs
docker-compose logs -f backend

# Stop environment
./scripts/dev-stop.sh

# Reset database
./scripts/dev-reset-db.sh
```

### Manual Development
```bash
# Install dependencies
cd backend && go mod download

# Run with hot reload (install air first)
go install github.com/cosmtrek/air@latest
air

# Or run directly
go run cmd/main.go
```

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Start Crawling (replace TOKEN)
```bash
curl -X POST http://localhost:8080/api/v1/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"url":"https://example.com"}'
```

## Development Workflow

This project is developed in stages for proper git commit management:

1. ✅ Project structure setup
2. ✅ Database schema and connections
3. ✅ Authentication system
4. ✅ Basic API endpoints
5. ✅ Web crawling logic
6. ✅ Queue system
7. ✅ Real-time updates
8. ✅ Docker configuration
9. 🔄 Testing and optimization
10. 🔲 Frontend development

## Default Users

The system includes default users for testing:
- **Username**: `admin`, **Password**: `password123`
- **Username**: `testuser`, **Password**: `password123`

## Documentation

- [Docker Setup Guide](docs/DOCKER_SETUP.md) - Comprehensive Docker development setup
- [API Documentation](docs/API.md) - Detailed API documentation (Coming soon)
- [Frontend Guide](docs/FRONTEND.md) - Frontend development guide (Coming soon)

## License

MIT License 