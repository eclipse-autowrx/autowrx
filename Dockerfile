FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN yarn global add vite
EXPOSE 4173
CMD ["vite", "preview", "--port", "4173", "--host"]
