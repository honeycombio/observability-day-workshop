
# O11yDay Meminator

This contains a sample application for use in the Observability Day workshops.

See it in action: [o11yday.jessitron.honeydemo.io]()

It generates images by combining a randomly chosen picture with a randomly chosen phrase.

## Workshop Agenda

1. Hello! Welcome to Advanced Instrumentation with OpenTelemetry. A few slides (LINK)
2. Look at this app. It has default instrumentation.
3. Run this app. See what the traces look like.
4. Improve the traces.

## Running the application

Run this locally in docker-compose, sending traces to Honeycomb. Then you can practice improving the instrumentation for better observability.

### one-time setup

Clone this repository.

```bash
git clone https://github.com/honeycombio/observability-day-workshop
```

Have Docker installed.

Edit `.env` if you would like to use the python implementation rather than nodejs.

Define your Honeycomb API key in an environment variable:

```bash
export HONEYCOMB_API_KEY=your-api-key
```

If you don't have an API key handy, here are the [docs](https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/#create-api-key).
If you want more stepping-through of how to get an API key, there are instructions for this in [Observaquiz](https://quiz.honeydemo.io); type in a name to get to the second page.

### run the app

`./run`

(this will run `docker compose` in daemon mode, and build containers)

Access the app:

[http://localhost:8080]()

after making changes to a service, you can tell it to rebuild just that one:

`./run [ meminator | backend-for-frontend | image-picker | phrase-picker ]`

### Try it out

Visit [http://localhost:8080]() and click the "GO" button. Then wait.

## Improving the tracing

The app begins with automatic instrumentation installed. Test the app, look at the tracing... how could it be better?

Here's my usual flow for looking at the most recent traces:

* log in to Honeycomb
* (you should be in the same environment where you got the API key; if you're not sure, there's [my little app](https://honeycomb-whoami.glitch.me) that calls Honeycomb's auth endpoint and tells you.)

See the data:

* Click New Query on the left
* At the top, it says 'New Query in &lt;dropdown&gt;' -- click the dropdown and pick the top option, "All datasets in ..."
* click 'Run Query'. Now you have a count of all events (trace spans, logs, and metrics). If it's 0, you're not getting data :sad:
* If you want to take a look at all the data, click on 'Events' under the graph.

Get more info (optional):
* change the time to 'Last 10 minutes' to zoom in on just now.
* In the query, click under 'GROUP BY' and add 'service.name' as a group-by field. GROUP BY means "show me the values please." 
* 'Run Query' again. (alt-enter also does it)
* Now see the table under the graph. You should see all 4 services from this app listed.

Get to a trace:
* In the graph, click on one of the lines. It brings up a popup menu.
* In the menu, click "View Trace"

This should take you to a trace view!

Does your trace include all 4 services?


## Workshop Facilitator Notes

See [MAINTENANCE.md](MAINTENANCE.md) for instructions on updating the containers on Dockerhub.