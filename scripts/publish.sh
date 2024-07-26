#!/bin/bash

# Publish all images in all languages

# goal: each of the ((4 services x 3 languages ) + 1 web) x 2 tags (latest & IMAGE_VERSION) = 26 tags updated in dockerhub
set -x
set -e

source .env

for lang in $(echo "python nodejs dotnet" ); do
  export PROGRAMMING_LANGUAGE=$lang
  echo "Let's publish the services in $PROGRAMMING_LANGUAGE in $IMAGE_VERSION"
  # hmm, web is gonna get triple-published. do we care? not yet.
  WORKSHOP_VERSION=${IMAGE_VERSION} docker compose -f docker-compose-publish.yaml build --push

  # there has to be a faster way to do this.
  for srv in $(echo "meminator image-picker phrase-picker backend-for-frontend"); do
    docker tag ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-${IMAGE_VERSION} ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-latest
    docker push ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-latest
  done
done

srv=web docker tag ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-${IMAGE_VERSION} ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-latest
srv=web docker push ${IMAGE_REPO_USER}/$srv:${PROGRAMMING_LANGUAGE}-latest