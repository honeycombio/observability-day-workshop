/**
 * This represents an internal library used for communication between services.
 * That is a common pattern, and a great place to customize some telemetry.
 */

import { context, trace, Attributes, SpanStatusCode, Span, SpanOptions } from '@opentelemetry/api';

const tracer = trace.getTracer("o11yday-lib");

/**
 * Use this to wrap _synchronous_ code in a span.
 * @param name name of the span
 * @param attributes 
 * @param fn 
 * @returns 
 */
export function inSpan<T>(name: string, attributes: Attributes, fn: () => T): T {
    return tracer.startActiveSpan(
        name,
        {
            attributes // this is a great place to add standard ones
        },
        context.active(),
        (span) => {
            try {
                const result = fn();
                return result;
            } catch (e) {
                if (e instanceof Error) {
                    span.recordException(e);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
                } else {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "some error that is not an Error: " + e });
                }
                throw e;
            } finally {
                span.end();
            }
        }
    );
}

/**
 * Use this to wrap asynchronous code in a span.
 * @param name name of the span
 * @param attributes 
 * @param fn async 
 * @returns 
 */
export function inSpanAsync<T>(name: string, options: SpanOptions, fn: (span: Span) => Promise<T>): Promise<T> {
    return tracer.startActiveSpan(
        name, options,
        async (span) => {
            try {
                const result = await fn(span);
                return result;
            } catch (e) {
                if (e instanceof Error) {
                    span.recordException(e);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
                } else {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "some error that is not an Error: " + e });
                }
                throw e;
            } finally {
                span.end();
            }
        }
    );
}