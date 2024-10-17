import { NodeSDK, logs } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import * as opentelemetry from "@opentelemetry/api";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { BunyanInstrumentation } from "@opentelemetry/instrumentation-bunyan";

opentelemetry.diag.setLogger(
  new opentelemetry.DiagConsoleLogger(),
  opentelemetry.DiagLogLevel.INFO
);
// The Trace Exporter exports the data to Honeycomb and uses
// environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
  traceExporter,
  // spanProcessors: [new ConfigurationSpanProcessor(), new BatchSpanProcessor(traceExporter)], // INSTRUMENTATION: report global configuration on every span
  logRecordProcessor: new logs.SimpleLogRecordProcessor(new OTLPLogExporter()),
  instrumentations: [
    new BunyanInstrumentation(),
    getNodeAutoInstrumentations(),
    // { '@opentelemetry/instrumentation-fs': { enabled: false } } // the fs tracing might be interesting here!
  ],
});

sdk.start();

console.log("Started OpenTelemetry SDK");
