import { Instrumentation, InstrumentationOption } from '@opentelemetry/instrumentation';
import { DetectorSync } from '@opentelemetry/resources';
export declare function parseInstrumentationOptions(options?: InstrumentationOption[]): Instrumentation[];
export declare function getResourceDetectorsFromEnv(): Array<DetectorSync>;
//# sourceMappingURL=utils.d.ts.map