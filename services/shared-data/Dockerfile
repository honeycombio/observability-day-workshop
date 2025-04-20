# Start with a minimal base image
FROM alpine:latest

# Create directory for the databases
WORKDIR /db

# Copy SQLite database files from your local build context
COPY users.db /db/users.db
COPY phrases.db /db/phrases.db

# No need for CMD or ENTRYPOINT since this is just a data container
