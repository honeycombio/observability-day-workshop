# Backend for Frontend

This Python service responds to /createPicture by gathering a random image and phrase,
and then asking meminator to put them together.

## setup

`python3 -m venv venv`

`source venv/bin/activate`

`pip install -r requirements.txt`

## Run

This won't have tracing. The setup for that is in Docker.

`python3 server.py`

## Test

`curl localhost:10114/createPicture`
