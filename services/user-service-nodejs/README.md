# User Service

A simple service that provides user information for the Meminator application.

## Endpoints

- `/current-user` - Returns information about the current user
- `/health` - Health check endpoint

## Running Locally

To run the service locally on port 3000:

```bash
cd services/user-service-nodejs
./run-local.sh
```

You can then access the service at http://localhost:3000/current-user

## Running in Docker

The service runs on port 10119 in Docker as part of the Meminator application.

```bash
# From the root of the project
./run user-service
```

You can then access the service at http://localhost:10119/current-user
