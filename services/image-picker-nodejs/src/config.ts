import {
    BatchSpanProcessor,
    Span,
    SpanExporter,
  } from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';

export const BUCKET_NAME = process.env.BUCKET_NAME || 'random-pictures';

export class ConfigurationSpanProcessor extends BatchSpanProcessor {
    constructor(exporter: SpanExporter, batchSpanProcessorConfig = {}) {
        super(exporter, batchSpanProcessorConfig);
    }
    onStart(span: Span, context: Context) {
        span.setAttributes({ "config.bucketName": BUCKET_NAME });
    }
}