# For workshop facilitators

## Publishing

To get new versions of the containers on Dockerhub for caching, log in appropriately.

set PROGRAMMING_LANGUAGE to what you need.

push `latest` tag:

`docker compose build --push`

push tag that is used for cache-from:

`WORKSHOP_VERSION=${IMAGE_VERSION} docker compose build --push`

... for each $PROGRAMMING_LANGUAGE implemented.

## Deploying

See [k8s/README.md](k8s/README.md) for my notes on deploying to Kubernetes.