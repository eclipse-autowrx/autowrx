FROM node:22-slim

RUN mkdir -p /usr/src/playground-be && chown -R node:node /usr/src/playground-be

WORKDIR /usr/src/playground-be

COPY package.json yarn.lock ./

RUN yarn install

USER node

COPY --chown=node:node static/ ./static/

EXPOSE 8080

