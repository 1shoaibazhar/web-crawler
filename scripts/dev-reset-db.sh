#!/bin/bash

# Web Crawler Database Reset Script
echo "🗄️ Resetting Web Crawler Database..."

# Confirmation prompt
read -p "⚠️  This will destroy all data in the database. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

echo "🛑 Stopping backend service..."
docker-compose stop backend

echo "🗑️ Removing database volume..."
docker-compose down -v

echo "🔄 Recreating database..."
docker-compose up -d mysql

echo "⏳ Waiting for MySQL to be ready..."
sleep 10
docker-compose exec mysql sh -c 'until mysqladmin ping -h localhost --silent; do echo "Waiting for MySQL..."; sleep 2; done'

echo "🚀 Starting backend (will run migrations)..."
docker-compose up -d backend

echo "✅ Database reset complete!"
echo ""
echo "🌐 Database admin available at: http://localhost:8081"
echo "📊 Default users should be created by migrations." 