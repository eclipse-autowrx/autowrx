# Stage 1: Build Frontend using build-frontend.sh script
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install bash (needed for build script)
RUN apk add --no-cache bash

# Create backend/static directory structure for build output
# This ensures backend/static exists before building frontend
RUN mkdir -p backend/static

# Copy frontend source code
COPY frontend/ ./frontend/

# Copy build script
COPY build-frontend.sh ./

# Install frontend dependencies and build
# The script will build into backend/static/frontend-dist/
RUN chmod +x build-frontend.sh && ./build-frontend.sh

# Stage 2: Build Backend (only backend code, no frontend source)
FROM node:20-alpine

RUN mkdir -p /usr/src/playground-be && chown -R node:node /usr/src/playground-be

WORKDIR /usr/src/playground-be

COPY backend/package.json backend/yarn.lock ./

RUN yarn install --frozen-lockfile --production

COPY --chown=node:node backend/ .

# Copy frontend build into backend static folder
COPY --from=frontend-builder --chown=node:node /app/backend/static/frontend-dist ./static/frontend-dist

USER node

EXPOSE 3200

ENV PORT=3200

CMD ["yarn", "prod:test"]

