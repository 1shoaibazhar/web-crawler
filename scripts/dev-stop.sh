#!/bin/bash

# Web Crawler Development Stop Script
echo "Stopping Web Crawler Development Environment..."

# Stop all services
docker-compose down

echo "All services stopped!"
echo ""
echo "To clean up completely (remove volumes):"
echo "   docker-compose down -v"
echo ""
echo "To restart:"
echo "   ./scripts/dev-start.sh" 