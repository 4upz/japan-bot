#!/bin/bash

# EC2 Deployment Script for Japan Trip Discord Bot

echo "🚀 Starting deployment..."

# Build Docker image
echo "Building Docker image..."
docker build -t japan-trip-bot .

# Stop existing container if running
echo "Stopping existing container..."
docker stop japan-trip-bot 2>/dev/null || true
docker rm japan-trip-bot 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Run new container
echo "Starting new container..."
docker run -d \
  --name japan-trip-bot \
  --restart unless-stopped \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/google-credentials.json:/app/google-credentials.json \
  japan-trip-bot

# Show container status
echo "Container status:"
docker ps | grep japan-trip-bot

echo "✅ Deployment complete!"
echo "📋 To view logs: docker logs -f japan-trip-bot"
echo "🛑 To stop: docker stop japan-trip-bot"