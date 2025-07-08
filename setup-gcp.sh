#!/bin/bash

# Google Cloud Platform Setup Script
# Run this locally to set up your GCP project

echo "🔧 Setting up Google Cloud Platform for Discord bot..."

# Set these variables
PROJECT_ID="bot-of-culture"
REGION="us-central1"

echo "📋 Setting up project: $PROJECT_ID"

# Set default project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable docs.googleapis.com
gcloud services enable drive.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Configure Docker for Google Container Registry
echo "Configuring Docker for GCR..."
gcloud auth configure-docker

# Create firewall rule if needed (Discord bot doesn't need external access)
echo "Setting up firewall rules..."
gcloud compute firewall-rules create allow-discord-bot \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:3000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=discord-bot 2>/dev/null || echo "Firewall rule already exists"

echo "✅ GCP setup complete!"
echo "📋 Next steps:"
echo "1. Update PROJECT_ID in gce-deploy.sh"
echo "2. Create .env file with your secrets"
echo "3. Upload google-credentials.json"
echo "4. Run: ./gce-deploy.sh"
echo ""
echo "💡 For automated deployment, use:"
echo "gcloud builds submit --config cloudbuild.yaml"