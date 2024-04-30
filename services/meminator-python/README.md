# Meminator

This Python service shells out to imagemagick to apply text to an image.

## setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

This won't have tracing. The setup for that is in Docker.

Mostly you run this as part of docker-compose at project root.

If you want to run just this one:

` opentelemetry-instrument flask --app src/server.py run`

## Test

Something like...

```bash
curl localhost:10114/applyPhraseToPicture -d '{"phrase":"Yo Yo Yo!", "imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg"}' -H "Content-Type: application/json" -X POST > out.jpg
```
