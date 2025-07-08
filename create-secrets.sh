#!/bin/bash

# Create secrets in Google Secret Manager from local .env file
# This script reads your .env file and creates secrets automatically

PROJECT_ID="bot-of-culture"

echo "🔐 Creating secrets in Google Secret Manager from .env file..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your secrets first."
    exit 1
fi

# Source the .env file to load variables
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Warning: $secret_name is empty in .env file, skipping..."
        return
    fi
    
    echo "Creating/updating $secret_name secret..."
    
    # Try to create the secret, if it exists, add a new version
    if gcloud secrets create $secret_name --data-file=- <<< "$secret_value" 2>/dev/null; then
        echo "✅ Created $secret_name secret"
    else
        echo "🔄 Secret $secret_name already exists, adding new version..."
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
        echo "✅ Updated $secret_name secret"
    fi
}

# Create secrets from .env variables
create_or_update_secret "DISCORD_TOKEN" "$DISCORD_TOKEN"
create_or_update_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" 
create_or_update_secret "GOOGLE_DOC_ID" "$GOOGLE_DOC_ID"

echo ""
echo "✅ Secrets setup complete!"
echo "📋 To view secrets:"
echo "gcloud secrets list"
echo ""
echo "🔍 To view a specific secret:"
echo "gcloud secrets versions access latest --secret=SECRET_NAME"