
# O11yDay Meminator

This contains a sample application for use in the Observability Day workshops.

It generates images by combining a randomly chosen picture with a randomly chosen phrase.

## Running the application

### one-time setup

Clone this repository.

Have Docker installed.

Edit `.env` if you would like to use the python implementation rather than nodejs.

Define your Honeycomb API key in an environment variable:

```bash
export HONEYCOMB_API_KEY=your-api-key
```

If you don't have an API key handy, here are the [docs](https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/#create-api-key).
If you want more stepping-through of how to get an API key, there are instructions for this in Observaquiz, at https://quiz.onlyspans.com; type in a name to get to the second page.

### run the app

`docker-compose up`

Access the app:

[http://localhost:8080]()

after making changes:

`docker-compose up --build`

### Try it out

Visit [http://localhost:8080]() and click the "GO" button. Then wait.

## Improving the tracing

The app begins with automatic instrumentation installed. Test the app, look at the tracing... how could it be better?

## Workshop Facilitator Notes

See [MAINTENANCE.md](MAINTENANCE.md) for instructions on updating the containers on Dockerhub.