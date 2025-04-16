#!/bin/bash

# Publish all images in all languages
# run this from project root as ./scripts/publish-all

# goal: each of the ((4 services x 3 languages ) + 1 web) x 2 tags (latest & DOCKERHUB_IMAGE_VERSION) = 26 tags updated in dockerhub
set -x
set -e

source .env

for lang in $(echo "python nodejs dotnet" ); do
  export PROGRAMMING_LANGUAGE=$lang
  echo "##########\n#\n# Let's publish the services in $PROGRAMMING_LANGUAGE in $DOCKERHUB_IMAGE_VERSION\n#\n##########"
  docker compose -f docker-compose-publish.yaml build --push
done

# and one stray, until we bring in a full java option
docker compose -f docker-compose-honeydemo-publish.yaml build --push phrase-picker
# and another stray, used in variety
docker compose -f docker-compose-honeydemo-publish.yaml build --push init-db