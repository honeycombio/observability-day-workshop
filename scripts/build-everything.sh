#!/bin/bash

# Script to pull all cache_from images and build Docker images for codespace prebuild
# This helps ensure the Docker cache is populated for faster builds in codespaces

set -e  # Exit on error
set -x  # Print commands for debugging

# Source environment variables
source .env

echo "=== Pulling cache images and building services for codespace prebuild ==="


# Pull web cache image (doesn't depend on programming language)
WEB_CACHE_IMAGE="${IMAGE_REPO_USER}/web:${DOCKERHUB_IMAGE_VERSION}"
echo "Pulling web cache image: $WEB_CACHE_IMAGE"
docker pull "$WEB_CACHE_IMAGE" || echo "Web cache image not found, will build from scratch"

echo "=== Pulling cache images from docker-compose.yaml for all languages ==="

# Pull cache images for all services in docker-compose.yaml for all languages
for LANG in "${LANGUAGES[@]}"; do
  echo "Pulling cache images for $LANG..."
  
  # Define services in the regular configuration
  SERVICES=("backend-for-frontend" "meminator" "phrase-picker" "image-picker" "user-service")
  
  for SERVICE in "${SERVICES[@]}"; do
    CACHE_IMAGE="${IMAGE_REPO_USER}/${SERVICE}:${LANG}-${DOCKERHUB_IMAGE_VERSION}"
    echo "Pulling cache image: $CACHE_IMAGE"
    docker pull "$CACHE_IMAGE" || echo "Cache image not found, will build from scratch"
  done
done

echo "=== Building services from docker-compose-variety.yaml (build-only) ==="

# Build all services from docker-compose-variety.yaml
docker compose -f docker-compose-variety.yaml build

# echo "=== Building services from docker-compose.yaml for all languages (build-only) ==="

# Build services from docker-compose.yaml for all languages
for LANG in "${LANGUAGES[@]}"; do
  echo "Building services for $LANG..."
  PROGRAMMING_LANGUAGE=$LANG docker compose -f docker-compose.yaml build
done

echo "=== Build completed ==="
echo "Docker cache is now populated with all required layers for codespace prebuild"
