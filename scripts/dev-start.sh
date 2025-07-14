#!/bin/bash

# Web Crawler Development Startup Script
echo "Starting Web Crawler Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Start the services
echo "Starting services with Docker Compose..."
docker-compose up -d mysql adminer

echo "Waiting for MySQL to be ready..."
docker-compose exec mysql sh -c 'until mysqladmin ping -h localhost --silent; do echo "Waiting for MySQL..."; sleep 2; done'

echo "Building and starting backend..."
docker-compose up -d backend

echo "Building and starting frontend..."
docker-compose up -d frontend

echo "Development environment is ready!"
echo ""
echo "Services available at:"
echo "   • Frontend App: http://localhost:3000"
echo "   • Backend API: http://localhost:8080"
echo "   • API Health: http://localhost:8080/health"
echo "   • Database Admin: http://localhost:8081 (adminer)"
echo "   • Database: localhost:3306"
echo ""
echo "Database credentials:"
echo "   • Server: mysql"
echo "   • Database: web_crawler"
echo "   • Username: crawler_user"
echo "   • Password: crawler_password"
echo ""
echo "Frontend will be available at http://localhost:3000 once it finishes building..."