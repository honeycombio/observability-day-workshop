#!/bin/bash

# Publish the images needed to deploy from github.com/honeycombio/demo, meminator directory
# to meminator.honeydemo.io

set -x
set -e

# it will read .env

echo "You're shipping this API key: $HONEYCOMB_API_KEY"

docker compose -f docker-compose-honeydemo-publish.yaml build --push $*

echo "https://hub.docker.com/r/o11yday/web/tags"