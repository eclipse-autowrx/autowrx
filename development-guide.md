# Development Guide

This guide will help you set up and run the AutoWRX project in **development mode** on your local machine.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Architecture](#architecture)
- [Access Points](#access-points)
- [Troubleshooting](#troubleshooting)

## Overview

AutoWRX consists of two separate services that run in parallel during development:

- **Backend**: Node.js/Express API server (port 3200)
- **Frontend**: React/Vite development server (port 3210)

### Important: Development vs. Deployment

**For Development:**
- You run the backend and frontend **directly on your machine** (not in Docker)
- Each service uses its own `.env` file (`backend/.env` and `frontend/.env`)
- Only MongoDB runs in Docker (or you can use a remote MongoDB)
- This allows for hot-reload, debugging, and faster iteration

**For Deployment:**
- See the [Instance Setup Guide](instance-setup/) in the `instance-setup/` directory

## Prerequisites

- **Node.js** 18+ and npm (or yarn)
- **Docker** (optional, for running MongoDB locally)
- **Git** (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd autowrx
```

### 2. Set Up MongoDB

You have two options:

#### Option A: Local MongoDB with Docker (Recommended)

```bash
# Start MongoDB container
docker run --name autowrx-mongo -p 27017:27017 -d mongo:4.4.6-bionic

# To stop MongoDB later:
# docker stop autowrx-mongo

# To start it again:
# docker start autowrx-mongo

# To remove the container (data will be lost):
# docker rm -f autowrx-mongo
```

#### Option B: Remote MongoDB

If you have a remote MongoDB instance, you can use it by setting the `MONGODB_URL` in your `backend/.env` file (see step 3 below).

### 3. Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your settings
# At minimum, ensure MONGODB_URL is correct:
# - For local Docker: MONGODB_URL=mongodb://localhost:27017/autowrx
# - For remote MongoDB: MONGODB_URL=mongodb://your-remote-host:27017/autowrx
```

### 4. Configure Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# The default .env should work for local development
# VITE_SERVER_BASE_URL=http://localhost:3200
# VITE_SERVER_VERSION=v2
```

### 5. Start the Services

You need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

That's it! The application should now be running.

## Detailed Setup

### Backend Configuration

The backend uses `backend/.env` for configuration. Key variables:

```bash
# Environment
NODE_ENV=development
PORT=3200

# Database
MONGODB_URL=mongodb://localhost:27017/autowrx
# For remote MongoDB:
# MONGODB_URL=mongodb://your-remote-host:27017/autowrx?authSource=admin

# JWT Configuration
JWT_SECRET=dev_secret_change_me
JWT_COOKIE_NAME=token

# Admin User (optional - creates admin on first run)
ADMIN_EMAILS=admin@example.com
ADMIN_PASSWORD=your-password

# CORS (for development, default is usually fine)
CORS_ORIGINS=localhost:\\d+,127\\.0\\.0\\.1:\\d+
```

**Important Notes:**
- `MONGODB_URL` must match your MongoDB setup (local Docker or remote)
- Change `JWT_SECRET` to a secure value (but not critical for local dev)
- Authentication settings (self-registration, public viewing, etc.) can be configured via the Site Configuration in the admin panel

### Frontend Configuration

The frontend uses `frontend/.env` for configuration. Key variables:

```bash
# Backend API URL
VITE_SERVER_BASE_URL=http://localhost:3200

# API Version
VITE_SERVER_VERSION=v2
```

**Note:** The frontend `.env` file is minimal. Most configuration is handled by the backend.

### MongoDB Setup Details

#### Using Docker (Recommended)

The MongoDB container will:
- Run on port `27017` (standard MongoDB port)
- Persist data in a Docker volume (data survives container restarts)
- Use the `mongo:4.4.6-bionic` image (matches production)

**Useful Docker Commands:**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs autowrx-mongo

# Connect to MongoDB shell
docker exec -it autowrx-mongo mongo

# Stop MongoDB
docker stop autowrx-mongo

# Start MongoDB
docker start autowrx-mongo

# Remove MongoDB (⚠️ deletes all data)
docker rm -f autowrx-mongo
```

#### Using Remote MongoDB

If you're using a remote MongoDB (e.g., MongoDB Atlas, or a team server):

1. Get the connection string from your MongoDB provider
2. Update `backend/.env`:
   ```bash
   MONGODB_URL=mongodb://username:password@host:port/database?authSource=admin
   ```
3. Ensure your network allows connections from your IP address

## Architecture

### How Development Mode Works

In development, the backend and frontend run as separate services with a proxy configuration:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
└─────────────────────────────────────────────────────────┘
                          │
                          │ http://localhost:3200
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│   Backend    │                    │   Frontend   │
│  (Port 3200) │◄──────────────────►│  (Port 3210) │
└──────────────┘                    └──────────────┘
        │                                   │
        │                                   │
        ▼                                   │
┌──────────────┐                           │
│   MongoDB    │                           │
│  (Port 27017)│                           │
└──────────────┘                           │
                                           │
        ┌──────────────────────────────────┘
        │
        │ Proxies /v2/*, /static/*, /imgs/*, /d/*
        │ to Backend
        │
        │ Proxies all other requests to Frontend
        │
        ▼
```

### Request Flow

1. **API Requests** (`/v2/*`, `/static/*`, `/imgs/*`, `/d/*`):
   - Frontend proxies these to Backend (port 3200)
   - Backend handles the request and returns the response

2. **Frontend Routes** (everything else):
   - Backend proxies these to Frontend (port 3210)
   - Frontend serves the React application

3. **Unified Access**:
   - You can access the full application at `http://localhost:3200`
   - The backend automatically proxies frontend requests

### Why This Setup?

- **Hot Reload**: Both services support hot-reload for fast development
- **Independent Development**: Frontend and backend can be developed separately
- **Easy Debugging**: You can debug each service independently
- **Production-like**: The unified access point (`localhost:3200`) mimics production behavior

## Access Points

Once both services are running, you can access:

- **Unified Application**: http://localhost:3200
  - This is the main entry point
  - Backend proxies frontend requests automatically

- **Frontend Only**: http://localhost:3210
  - Direct access to the Vite dev server
  - Useful for frontend-only development

- **Backend API Only**: http://localhost:3200/v2
  - Direct API access
  - Useful for testing API endpoints

- **API Documentation**: http://localhost:3200/api-docs
  - Swagger/OpenAPI documentation (if enabled)

## Troubleshooting

### Backend won't start

**Issue:** `Error: Cannot connect to MongoDB`

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   docker ps | grep mongo
   ```
2. Verify `MONGODB_URL` in `backend/.env` matches your MongoDB setup
3. For Docker MongoDB, ensure the container is running:
   ```bash
   docker start autowrx-mongo
   ```
4. For remote MongoDB, check network connectivity and credentials

**Issue:** `Port 3200 already in use`

**Solutions:**
1. Find what's using the port:
   ```bash
   lsof -i :3200
   ```
2. Stop the conflicting process, or change `PORT` in `backend/.env`

### Frontend won't start

**Issue:** `Port 3210 already in use`

**Solutions:**
1. Find what's using the port:
   ```bash
   lsof -i :3210
   ```
2. Stop the conflicting process, or change the port in `frontend/vite.config.ts`

**Issue:** `Cannot connect to backend API`

**Solutions:**
1. Ensure backend is running on port 3200
2. Check `VITE_SERVER_BASE_URL` in `frontend/.env` is `http://localhost:3200`
3. Check browser console for CORS errors (may need to adjust `CORS_ORIGINS` in backend)

### MongoDB Issues

**Issue:** `MongoDB container won't start`

**Solutions:**
1. Check if port 27017 is already in use:
   ```bash
   lsof -i :27017
   ```
2. Remove the old container and create a new one:
   ```bash
   docker rm -f autowrx-mongo
   docker run --name autowrx-mongo -p 27017:27017 -d mongo:4.4.6-bionic
   ```

**Issue:** `Connection refused to MongoDB`

**Solutions:**
1. Ensure MongoDB container is running: `docker ps`
2. Check MongoDB logs: `docker logs autowrx-mongo`
3. Verify `MONGODB_URL` in `backend/.env` uses `localhost` (not `127.0.0.1` or container name)

### General Issues

**Issue:** `npm install fails`

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`, then reinstall
3. Ensure you're using Node.js 18+

**Issue:** `Changes not reflecting (hot reload not working)`

**Solutions:**
1. Check that you're running `npm run dev` (not `npm start`)
2. Restart the dev server
3. Clear browser cache

**Issue:** `CORS errors in browser console`

**Solutions:**
1. Check `CORS_ORIGINS` in `backend/.env` includes your frontend URL
2. For development, use: `CORS_ORIGINS=localhost:\\d+,127\\.0\\.0\\.1:\\d+`
3. Restart the backend after changing `.env`

## Next Steps

- Read the [Project Structure Documentation](docs/project-structure.md)
- Explore the [API Documentation](backend/docs/)
- Check out the [Plugin Development Guide](docs/plugin/README.md)
- Review the [Deployment Guide](docs/deployment/README.md) for production setup

## Getting Help

- Check existing documentation in the `docs/` directory
- Review the [Instance Setup Guide](instance-setup/) for deployment questions
- Check GitHub issues for known problems
- Review backend and frontend README files for service-specific information

---

**Note:** This guide is for **development** only. For production deployment, see the [Instance Setup Guide](instance-setup/) in the `instance-setup/` directory.
