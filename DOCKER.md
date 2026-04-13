# 🐳 Docker Quick Start

Run Kotoka with a single command!

## Prerequisites

- Docker Desktop installed and running
- Environment variables configured (see `.env.example`)

## One-Command Startup

```bash
docker-compose up --build
```

This will:
1. Start PostgreSQL database (port 5433)
2. Build the application
3. Run database migrations
4. Start the Next.js server (port 3000)

## Access the App

Open your browser to: **http://localhost:3000**

## Environment Variables

Create a `.env` file in the project root with your values:

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `GEMINI_API_KEY` - Google Gemini AI key
- `AZURE_SPEECH_KEY` - Azure Speech Service key
- `AZURE_SPEECH_REGION` - Azure region (default: `eastus`)

**Optional variables:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `ZEROBOUNCE_API_KEY` - Email validation

## Stopping the App

```bash
docker-compose down
```

## Reset Everything

```bash
docker-compose down -v    # Stop and remove volumes
docker-compose up --build # Fresh start
```
