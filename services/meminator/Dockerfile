# Use an official Node.js runtime as the base image
FROM node:20-alpine

RUN apk --no-cache add imagemagick

# Create a directory for custom fonts
RUN mkdir -p /usr/share/fonts/truetype
# Copy font files from host to container
COPY ./Angkor/*.ttf /usr/share/fonts/truetype/
# Refresh font cache
RUN fc-cache -f -v

# Set the working directory in the container
WORKDIR /usr/src/app


# Copy package.json and package-lock.json to the working directory
# COPY package*.json ./

# Install dependencies
# RUN npm install

# Copy the application code to the working directory
COPY . .

# Expose the port that your app runs on
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]
