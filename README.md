# Web Crawler

A modern web crawler that helps you analyze websites efficiently. Built with Go and React, it provides real-time crawling with a beautiful interface.

## What it does

- **Smart Crawling**: Crawl websites with real-time progress updates
- **Task Management**: Start, stop, and monitor multiple crawling tasks
- **Real-time Updates**: See progress as it happens with WebSocket connections
- **User Authentication**: Secure login system to keep your data private
- **Beautiful Interface**: Modern React frontend that works on all devices
- **Bulk Operations**: Manage multiple tasks at once
- **Detailed Analysis**: Get insights like:
  - Page titles and structure
  - Internal vs external links
  - Broken links detection
  - HTML version information
  - Form detection

## Getting Started

The easiest way to get up and running is with Docker:

```bash
# Start everything up
./scripts/dev-start.sh

# Open your browser to:
# - Web App: http://localhost:3000
# - API: http://localhost:8080
```

Need more details? Check out our [Docker Setup Guide](docs/DOCKER_SETUP.md).

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
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
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

### Frontend
- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Router** - Client-side routing
- **WebSocket** - Real-time updates

## Manual Setup

Prefer to set things up manually? Here's how:

### What you'll need
- Go 1.21 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher

### Backend
```bash
cd backend
go mod download
# Set up your database and run migrations
go run cmd/main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
You'll need to set these up:

```bash
# Backend
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=web_crawler
JWT_SECRET=your-secret-key
SERVER_PORT=8080

# Frontend
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
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

### Docker Development
```bash
# Start everything
./scripts/dev-start.sh

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
./scripts/dev-stop.sh

# Reset the database
./scripts/dev-reset-db.sh
```

### Local Development
```bash
# Backend
cd backend && go mod download
go run cmd/main.go

# Frontend (in another terminal)
cd frontend && npm install
npm run dev
```

## Try it out

### Web Interface
1. Open http://localhost:3000 in your browser
2. Create an account or use the default credentials below
3. Start crawling and watch the magic happen!

### API Examples
```bash
# Create a user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Log in
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Start crawling (replace TOKEN with your actual token)
curl -X POST http://localhost:8080/api/v1/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"url":"https://example.com"}'
```

## Default Users

Ready to test? Use these accounts:
- **Username**: `admin`, **Password**: `password123`
- **Username**: `testuser`, **Password**: `password123`

## Documentation

- [Docker Setup Guide](docs/DOCKER_SETUP.md) - Comprehensive Docker development setup 