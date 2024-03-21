/**
 * This represents an internal library used for communication between services.
 * That is a common pattern, and a great place to customize some telemetry.
 */

const SERVICES = {
    meminator: 'http://meminator:3000/applyPhraseToPicture'
}

export function fetchFromService(service: keyof typeof SERVICES) {
    return fetch(SERVICES[service]); // ... implementation
}