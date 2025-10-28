#!/bin/bash

# Copyright (c) 2025 Eclipse Foundation.
#
# This program and the accompanying materials are made available under the
# terms of the MIT License which is available at
# https://opensource.org/licenses/MIT.
#
# SPDX-License-Identifier: MIT

# Load environment variables from .env file
source .env

yarn

# Validate environment variables
if [ -z "$ENV" ]; then
  echo "ENV is not set"
  exit 1
fi

if [ -z "$PORT" ]; then
  echo "PORT is not set"
  exit 1
fi

if [ -z "$KONG_PROXY_PORT" ]; then
  echo "KONG_PROXY_PORT is not set"
  exit 1
fi

if [ ! -d "$UPLOAD_PATH" ]; then
  echo "Creating directory $UPLOAD_PATH"
  sudo mkdir -p "$UPLOAD_PATH"
fi

# Set permissions for the directory
echo "Setting permissions for $UPLOAD_PATH"
sudo chown -R 1000:1000 "$UPLOAD_PATH"
sudo chmod -R 775 "$UPLOAD_PATH"

# Initialize variables
DOCKER_COMMAND=""
NO_CACHE=""
DETACH=""
BUILD=""

# Check for arguments
for arg in "$@"
do
  case $arg in
    --no-cache)
      NO_CACHE="--no-cache"
      shift
      ;;
    -d)
      DETACH="-d"
      shift
      ;;
    --build)
      BUILD="--build"
      shift
      ;;
    -prod)
      ENV_SUFFIX="prod"
      shift
      ;;
    *)
      # Handle unexpected arguments
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# Determine the Docker Compose command based on the -prod flag
if [ "$ENV_SUFFIX" == "prod" ]; then
  RESTART_POLICY="always"
  DOCKER_COMMAND="docker compose -p ${ENV}-playground-be -f docker-compose.yml -f docker-compose.prod.yml up $BUILD $NO_CACHE $DETACH"
else
  RESTART_POLICY="no"
  DOCKER_COMMAND="docker compose -p ${ENV}-playground-be -f docker-compose.yml -f docker-compose.dev.yml up $BUILD $NO_CACHE $DETACH"
fi

export RESTART_POLICY

# Run Docker Compose
echo "Starting Docker Compose with command: $DOCKER_COMMAND"
$DOCKER_COMMAND
