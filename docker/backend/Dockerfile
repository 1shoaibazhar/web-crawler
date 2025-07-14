# Development Dockerfile with hot reload
FROM golang:1.24-alpine

# Install Air for hot reload
RUN go install github.com/air-verse/air@latest

# Set working directory
WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy Air configuration
COPY docker/backend/.air.toml .

# Expose port
EXPOSE 8080

# Command will be overridden in docker-compose
CMD ["air", "-c", ".air.toml"] 