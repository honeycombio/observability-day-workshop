#!/bin/bash

# Publish all images in all languages

# goal: each of the ((4 services x 3 languages ) + 1 web) x 2 tags (latest & DOCKERHUB_IMAGE_VERSION) = 26 tags updated in dockerhub
set -x
set -e

source .env

for lang in $(echo "python nodejs dotnet" ); do
  export PROGRAMMING_LANGUAGE=$lang
  echo "##########\n#\n# Let's publish the services in $PROGRAMMING_LANGUAGE in $DOCKERHUB_IMAGE_VERSION\n#\n##########"
  WORKSHOP_VERSION=${DOCKERHUB_IMAGE_VERSION} docker compose -f docker-compose-publish.yaml build --push
done
