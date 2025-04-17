import { trace } from '@opentelemetry/api';

export class FeatureFlags {
    useLibrary(): boolean {
        const value = Math.random() < 0.25;
        trace.getActiveSpan()?.setAttribute('app.featureFlag.useLibrary', value);
        return value;
    }
}