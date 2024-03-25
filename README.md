
# O11yDay Meminator

This contains a sample application for use in the Observability Day workshops.

It generates images by combining a randomly chosen picture with a randomly chosen phrase.

## Running the application

### one-time setup

Clone this repository.

Have Docker installed.

IMPORTANT: copy the `.env.example` file to `.env` and fill in the values.

`cp .env.example .env`

Now edit `.env` and fill in your Honeycomb API key. (The easiest instructions for this are the ones I made at https://quiz.onlyspans.com, type in a name to get to the second page)

### run the app

`docker-compose up`

Access the app:

[http://localhost:8080]()

after making changes:

`docker-compose up --build`

## Structure of the Application

Check `docker-compose.yaml` to see the different services.

### web

The frontend is static files in `services/web/static`

The `services/web` directory also contains a Dockerfile and config for nginx to serve these. The nginx config also directs anything to /backend toward the backend-for-frontend service.

### backend-for-frontend

... for the rest, see the traces :D

## Workshop Facilitator Notes

See [MAINTENANCE.md](MAINTENANCE.md) for instructions on updating the containers on Dockerhub.