const { NodeSDK, logs } = require('@opentelemetry/sdk-node');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { BunyanInstrumentation } = require('@opentelemetry/instrumentation-bunyan');

// turn on OpenTelemetry debugging
process.env.OTEL_LOG_LEVEL = 'debug';

// Configure the OpenTelemetry SDK with OTLP exporter and Bunyan logging instrumentation
const sdk = new NodeSDK({
  logRecordProcessor: new logs.SimpleLogRecordProcessor(new OTLPLogExporter()),
  instrumentations: [
    new BunyanInstrumentation(),
  ]
});
// Start the SDK
sdk.start();
// Make sure the sdk is shutdown properly before exiting so pending logs are sent before stopping
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .finally(() => process.exit(0));
});

const bunyan = require('bunyan');

// Create a logger and use in your app
const logger = bunyan.createLogger({ name: 'myapp', level: 'info' });
logger.info({ 'app.message': 'Something interesting happened' });

console.log("...");
setTimeout(() => { console.log("done") }, 10000);
