FROM node:18-bullseye

WORKDIR /app

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy package.json and install dependencies
COPY services/user-service-nodejs/package*.json ./
RUN npm install

# Copy application code
COPY services/user-service-nodejs/ ./

# Create shared-data directory
RUN mkdir -p /app/shared-data

# Note: The database file (users.db) is expected to be in the shared-data directory
# It is managed in git and should not be modified by the container

ENV PORT=10119
EXPOSE 10119

CMD ["node", "index.js"]
