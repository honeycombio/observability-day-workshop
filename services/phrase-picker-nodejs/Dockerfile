# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Install SQLite
RUN apk --no-cache add sqlite

# Set the working directory in the container
WORKDIR /usr/src/app

# Create shared-data directory
RUN mkdir -p /usr/src/app/shared-data

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

COPY tsconfig.json .
# Copy the rest of the application code to the working directory
COPY ./src ./src

RUN npx tsc

# Expose the port that your app runs on
EXPOSE 10117

# Command to run your application
CMD ["npm", "start"]
