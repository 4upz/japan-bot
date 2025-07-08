# Japan Trip Discord Bot

A Discord bot that uses your Google Doc as a source of truth for trip planning questions.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Fill in your `.env` file with the required values (see below)

4. Add your Google Service Account credentials as `google-credentials.json`

5. Run the bot:
```bash
npm start
```

6. Deploy the bot:
Deployment steps have been made easy using Gcloud Build and Docker.
```bash
gcloud builds submit --config cloudbuild.yaml
```
Just make sure your project and credentials are correctly configured for the gcloud cli.

## Usage

Simply mention the bot in your Discord channel with a question:
```
@JapanBot What restaurants are we going to?
@JapanBot When do we arrive in Tokyo?
@JapanBot What's our budget for activities?
```

The bot will intelligently find relevant sections from your Google Doc and provide answers using GPT-4o.

## Features

- Smart chunking to minimize API costs
- Caches Google Doc content for 30 minutes
- Detects question topics (restaurants, hotels, activities, etc.)
- Only sends relevant document sections to GPT-4o
- Fallback handling for unclear questions