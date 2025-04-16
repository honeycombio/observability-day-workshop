# For workshop facilitators

After making changes and before a workshop, deploy. Also get the cached images and Codespaces prebuild updated. See below & then far below.

## Deploying

This is deployed to meminator.honeydemo.io in the SA Demo k8s cluster.
The yaml for this is in the honeycombio/demo repo (private).

To deploy,

- log in to Docker as o11yday user
- update the DOCKERHUB_IMAGE_VERSION in .env
- Set DEMO_TEAM_INGEST_KEY_FOR_MEMINATOR to an ingest key for demo/meminator environment - this gets built into the web image
- run `scripts/publish-honeydemo.sh`
- check that something was indeed pushed to Dockerhub
- log in to AWS
- go to the demo repo, meminator directory
- run the update script there.
- check it in k9s, sa-demo cluster, meminator namespace
- check that it works at [https://meminator.honeydemo.io]()
- check that you see traces in [https://ui.honeycomb.io/demo/environments/meminator/]()

## Structure of the Application

Check `docker-compose.yaml` to see the different services.

Most of them are available in multiple languages.

### web

The frontend is static files in `services/web/static`

The `services/web` directory also contains a Dockerfile and config for nginx to serve these. The nginx config also directs anything to /backend toward the backend-for-frontend service.

This one is not multi-language. Sorry, the browser runs JS.

### backend-for-frontend

this one receives /createPicture (which the client sends as /backend/createPicture; nginx strips the prefix)
and it calls out to the other services.

### image-picker

the images are in my (devrel sandbox's) S3 bucket, 'random-pictures'.
They really could be anywhere. The service has a hard-coded list.

### phrase-picker

Easiest one. hard-coded list of phrases.

### meminator

This one will always be in a Docker container, because it has 'imagemagick' installed, and a font, and a jpg library.

It downloads the image to the local filesystem, then runs imagemagick to overlay the text, then returns the result (as binary image data).

It throws files in /tmp, which it never cleans out.

### user-service

this one uses a sqlite database to hold its random users. Only Python has instrumentation for sqlite.

## Publishing images to attempt to make Advanced Instrumentation loading faster

`cache_from` in the Dockerfile says "hey, the layers in this image may help you."
These layers include the install steps, which are what take forever (especially on hotel wifi) because they download stuff.
So we push some images, and then we have the scripts pull them so that the layers are available locally. Downloading the layers beats
downloading all the apt-install etc etc.

Increment the DOCKERHUB_IMAGE_VERSION in .env (if you haven't already)

Be logged in to Docker as [o11yday](https://hub.docker.com/u/o11yday). This is in 1Password somewhere.

Run `scripts/publish-all.sh`

Go to [Dockerhub](https://hub.docker.com/u/o11yday) and see some new tags

### Better: the Codespaces prebuild

With a prebuild for a Codespace, people can actually start the app in 2-3 minutes ON HOTEL WIFI. Amazing!

Trigger creation of a new prebuild by changing something in .devcontainer/devcontainer.json, and pushing.
Maybe pass an argument to the build script, it'll ignore it.
