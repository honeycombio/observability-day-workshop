import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import * as opentelemetry from '@opentelemetry/api';
import { ConfigurationSpanProcessor } from './config.ts';

opentelemetry.diag.setLogger(
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.INFO
);
// The Trace Exporter exports the data to Honeycomb and uses
// environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
    // traceExporter, // when you have spanProcessors, this is ignored! Add it to the processors, inside a BatchSpanProcessor.
    spanProcessors: [new ConfigurationSpanProcessor(), new BatchSpanProcessor(traceExporter)],
    instrumentations: [getNodeAutoInstrumentations(
        { '@opentelemetry/instrumentation-fs': { enabled: false } }
    )]
});

sdk.start();

console.log("Started OpenTelemetry SDK in image-picker");
