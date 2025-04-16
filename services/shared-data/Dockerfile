# Start with a minimal base image
FROM alpine:latest

# Create directory for the database
WORKDIR /db

# Copy your SQLite database file from your local build context
COPY users.db /db/users.db

# No need for CMD or ENTRYPOINT since this is just a data container
