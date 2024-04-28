import { trace } from '@opentelemetry/api';

export class FeatureFlags {
    useLibrary(): boolean {
        const value = false;
        trace.getActiveSpan()?.setAttribute('app.featureFlag.useLibrary', value);
        return value;
    }
}