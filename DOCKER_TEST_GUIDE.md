# Testing Docker Production Setup Locally

This guide will help you test the production Docker setup (`Dockerfile` and `docker-compose.prod.yml`) on your local PC.

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- At least 4GB free disk space

## Step-by-Step Instructions

### Step 1: Navigate to Project Root

```bash
cd /Users/nhan/Desktop/dav3/autowrx
```

### Step 2: Create Environment File

Create a `.env.prod` file in the project root:

```bash
cat > .env.prod << 'EOF'
# Environment
ENV=prod
NODE_ENV=production

# Port Configuration
PORT=3200
FRONTEND_PORT=3200

# Database
MONGODB_URL=mongodb://autowrx-db:27017/autowrx

# JWT Configuration (IMPORTANT: Change this secret!)
JWT_SECRET=dev-secret-key-change-in-production
JWT_COOKIE_NAME=token
STRICT_AUTH=false

# CORS Configuration
CORS_ORIGINS=localhost:\\d+,127\\.0\\.0\\.1:\\d+

# Admin Configuration (optional - creates admin user on first run)
ADMIN_EMAILS=admin@example.com
ADMIN_PASSWORD=admin123

# Upload Path
UPLOAD_PATH_HOST=./data/upload

# Docker Image Configuration (optional)
GITHUB_REPOSITORY=eclipse-autowrx/autowrx
IMAGE_TAG=latest
EOF
```

Or manually create `.env.prod` file and paste the content above.

**Note:** Set `STRICT_AUTH=false` for local testing to allow user registration.

### Step 3: Ensure Build Script is Executable

```bash
chmod +x build-frontend.sh
```

### Step 4: Build and Start Containers

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build
```

This will:
- Build the frontend in the first stage
- Build the backend Docker image
- Start MongoDB container
- Start the AutoWRX application container

**First build will take 5-10 minutes** (downloads dependencies, builds frontend)

### Step 5: Verify Containers are Running

Open a new terminal and check:

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see:
- `prod-autowrx` (backend + frontend)
- `prod-autowrx-db` (MongoDB)

### Step 6: Check Logs

Watch the application logs:

```bash
docker compose -f docker-compose.prod.yml logs -f autowrx
```

You should see:
- "Connected to MongoDB"
- "🚀 Backend running in PRODUCTION mode"
- "Listening to port 3200"

### Step 7: Access the Application

Open your browser and navigate to:

```
http://localhost:3200
```

You should see the AutoWRX frontend!

### Step 8: Test the API

Test the backend API:

```bash
curl http://localhost:3200/v2/health
```

Or test in browser: `http://localhost:3200/v2/health`

## Troubleshooting

### Issue: Build fails with "build-frontend.sh: not found"

**Solution:** Make sure the script is executable:
```bash
chmod +x build-frontend.sh
```

### Issue: MongoDB connection error

**Solution:** Wait a few seconds for MongoDB to start, then check logs:
```bash
docker compose -f docker-compose.prod.yml logs autowrx-db
```

### Issue: Port 3200 already in use

**Solution:** Change the port in `.env.prod`:
```bash
FRONTEND_PORT=3201
PORT=3200
```

Then restart:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Issue: Frontend not loading

**Solution:** Check if frontend was built correctly:
```bash
docker compose -f docker-compose.prod.yml exec autowrx ls -la /usr/src/playground-be/static/frontend-dist/
```

You should see `index.html` and assets folders.

## Running in Background (Detached Mode)

To run in the background:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Stopping Containers

```bash
docker compose -f docker-compose.prod.yml down
```

To also remove volumes (clears database):

```bash
docker compose -f docker-compose.prod.yml down -v
```

## Rebuilding After Code Changes

If you make code changes:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build
```

## Quick Test Commands

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View only backend logs
docker compose -f docker-compose.prod.yml logs -f autowrx

# Execute command in container
docker compose -f docker-compose.prod.yml exec autowrx sh

# Check backend health
curl http://localhost:3200/v2/health
```

## Next Steps

Once everything is working:
1. Test user registration/login
2. Test API endpoints
3. Test frontend features
4. Check MongoDB data persistence

