FROM node:18-slim

WORKDIR /app

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create shared-data directory
RUN mkdir -p ../shared-data

# Copy shared-data files
COPY ../shared-data/users.db ../shared-data/

ENV PORT=10119
EXPOSE 10119

CMD ["node", "index.js"]
