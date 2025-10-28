# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

# Stage 2: Build Backend with Frontend
FROM node:20-alpine

RUN mkdir -p /usr/src/playground-be && chown -R node:node /usr/src/playground-be

WORKDIR /usr/src/playground-be

COPY backend/package.json backend/yarn.lock ./

RUN yarn install --frozen-lockfile --production

COPY --chown=node:node backend/ .

# Copy frontend build into backend static folder
COPY --from=frontend-builder --chown=node:node /app/frontend/dist ./static

USER node

EXPOSE 8080

CMD ["yarn", "start"]

