# Development Setup

This project consists of two separate services that run in parallel during development:

- **Backend**: Node.js/Express API server (port 3200)
- **Frontend**: React/Vite development server (port 3210)

## Quick Start

### Backend - Terminal 1
```bash
# Terminal 1 - Backend
cd backend

## run one mongo db instance if you don't have yet
docker run --name autowrx-mongo -p 27017:27017 -d mongo:4.4.6-bionic

npm install
# Create .env file from example 
cp .env.example .env

npm run dev
```

# Frontend - Terminal 2
```bash
cd frontend

npm install
# Create .env file from example 
cp .env.example .env

npm run dev
```

## Access Points

- **Frontend only**: http://localhost:3210
- **Backend API only**: http://localhost:3200/v2
- **Unified access**: http://localhost:3200 (proxies frontend + API)

## How It Works

The development setup uses a proxy configuration:

1. **Backend (port 3200)**:
   - Serves API routes (`/v2/*`)
   - Serves static files (`/static/*`, `/imgs/*`, `/d/*`)
   - In development mode, proxies all other requests to frontend (port 3210)

2. **Frontend (port 3210)**:
   - Serves the React application
   - Proxies API calls (`/v2/*`, `/static/*`, `/imgs/*`, `/d/*`) to backend (port 3200)

This setup allows you to access the full application at `localhost:3200` while keeping both services running independently for development.

## Production

In production, the frontend is built and served as static files by the backend, eliminating the need for two separate services.
