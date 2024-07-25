/**
 * This represents an internal library used for communication between services.
 * That is a common pattern, and a great place to customize some telemetry.
 */

import { context, trace, Attributes, SpanStatusCode, Span, SpanOptions } from '@opentelemetry/api';

const SERVICES = {
    meminator: 'http://meminator:10116/applyPhraseToPicture', // this one is a POST
    'phrase-picker': 'http://phrase-picker:10117/phrase',
    'image-picker': 'http://image-picker:10118/imageUrl',
}

type FetchOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE",
    body?: any // will be stringified
}

/**
 * Make an HTTP request to one of our services.
 * 
 * INSTRUMENTATION: internal libraries like this one are a great place to add telemetry.
 * 
 * @param service one of our known services
 * @param options choose method and/or send a body
 * @returns 
 */
export async function fetchFromService(service: keyof typeof SERVICES, options?: FetchOptions) {
    const { method, body: bodyObject } = options || { method: "GET" };
    let body: string | null = null;
    if (bodyObject) {
        body = JSON.stringify(bodyObject);
    }
    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    }

    const url = SERVICES[service];

    const response = await fetch(url, { headers, method, body });

    return response;
}

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