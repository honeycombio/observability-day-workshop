#!/bin/bash

# Publish the images needed to deploy from github.com/honeycombio/demo, meminator directory
# to meminator.honeydemo.io

# set HONEYCOMB_API_KEY_WEB to the one that should be used in the frontend image

set -x
set -e

# it will read .env

docker compose -f docker-compose-honeydemo.yaml build --push    

echo "https://hub.docker.com/r/o11yday/web/tags"