#!/bin/bash

# Publish all images in all languages

set -x
set -e

source .env

for lang in $(echo "python nodejs dotnet" ); do
  export PROGRAMMING_LANGUAGE=$lang
  echo "Let's publish the services in $PROGRAMMING_LANGUAGE"
  # hmm, web is gonna get triple-published. do we care? not yet.
  WORKSHOP_VERSION="latest" docker compose -f docker-compose-publish.yaml build --push 

  WORKSHOP_VERSION=${IMAGE_VERSION} docker compose build --push
done