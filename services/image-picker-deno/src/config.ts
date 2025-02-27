import {
    NoopSpanProcessor,
    Span,
} from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';

export const BUCKET_NAME = process.env.BUCKET_NAME || 'random-pictures';
const bucketNameSource = process.env.BUCKET_NAME ? "env" : "default";

export class ConfigurationSpanProcessor extends NoopSpanProcessor {
    onStart(span: Span, context: Context) {
        span.setAttributes({ "config.bucketName.value": BUCKET_NAME, "config.bucketName.source": bucketNameSource });
    }
}