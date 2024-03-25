import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import * as opentelemetry from '@opentelemetry/api';

opentelemetry.diag.setLogger(
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.INFO
);
// The Trace Exporter exports the data to Honeycomb and uses
// environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations(
        { '@opentelemetry/instrumentation-fs': { enabled: false } } 
    )]
});

sdk.start();

console.log("Started OpenTelemetry SDK in phrase-picker");
