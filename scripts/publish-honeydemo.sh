#!/bin/bash

# Publish the images needed to deploy from github.com/honeycombio/demo, meminator directory
# to meminator.honeydemo.io

# There's trickiness with the web one - it needs and api key that points to the right env,
# which is not the env key that I use locally. That ingest API key gets baked in.

set -x
set -e

# it will read .env

echo "You're shipping this API key: $HONEYCOMB_API_KEY"

export HONEYCOMB_API_KEY=$DEMO_TEAM_INGEST_KEY_FOR_MEMINATOR

docker compose -f docker-compose-honeydemo-publish.yaml build --push $*

echo "https://hub.docker.com/r/o11yday/web/tags"