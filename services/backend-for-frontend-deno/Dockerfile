# Use an official Deno runtime as the base image
FROM denoland/deno:latest

# Set the working directory in the container
WORKDIR /app
COPY . .

RUN deno cache src/index.ts --allow-scripts

# Expose the port that your app runs on
EXPOSE 10115

# Command to run your application
CMD ["deno", "task", "start"]
