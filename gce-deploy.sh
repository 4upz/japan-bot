#!/bin/bash

# Google Compute Engine Deployment Script
# Deploy Discord bot to GCE with Docker

PROJECT_ID="bot-of-culture"
INSTANCE_NAME="japan-trip-bot"
ZONE="us-central1-a"
MACHINE_TYPE="e2-micro"  # Free tier eligible
IMAGE_FAMILY="cos-stable"  # Container-Optimized OS

echo "🚀 Deploying Discord bot to Google Compute Engine..."

# Build and push to Artifact Registry
# echo "Building Docker image..."
# docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/japan-trip-bot/japan-trip-bot .

# echo "Pushing to Artifact Registry..."
# docker push us-central1-docker.pkg.dev/$PROJECT_ID/japan-trip-bot/japan-trip-bot

# Create GCE instance with Container-Optimized OS
echo "Creating GCE instance..."
gcloud compute instances create-with-container $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --service-account=japan-bot@bot-of-culture.iam.gserviceaccount.com \
  --network-interface=network-tier=PREMIUM,subnet=default \
  --container-image=us-central1-docker.pkg.dev/$PROJECT_ID/japan-trip-bot/japan-trip-bot \
  --container-restart-policy=always \
  --container-env-file=.env \
  --boot-disk-type=pd-standard \
  --boot-disk-device-name=$INSTANCE_NAME \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=discord-bot

echo "✅ Deployment complete!"
echo "📋 Instance details:"
gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE

echo "🔍 To view logs:"
echo "gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='docker logs \$(docker ps -q)'"