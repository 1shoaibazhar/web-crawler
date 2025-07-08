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
├── docker/                # Docker configuration
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

### Frontend (Todo)
- **React** - Frontend framework
- **WebSocket** - Real-time updates
- **Material-UI** - UI components

## Setup Instructions

### Prerequisites
- Go 1.21 or higher
- MySQL 8.0 or higher
- Docker (optional)

### Backend Setup
1. Navigate to backend directory
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

- `POST /api/auth/login` - User authentication
- `POST /api/crawl` - Start crawling task
- `GET /api/crawl/:id` - Get crawling status
- `PUT /api/crawl/:id/stop` - Stop crawling task
- `GET /api/crawl/:id/results` - Get crawling results
- `WebSocket /ws` - Real-time updates


## License

MIT License 