# Use nginx base image
FROM nginx:alpine

RUN echo "Fart"

# Copy index.html from the current directory to nginx root directory
# it's this or mount the volume, which supports updates... use that under development
COPY dist/* /usr/share/nginx/html 

# Copy nginx configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Command to start nginx when container runs
CMD ["nginx", "-g", "daemon off;"]
