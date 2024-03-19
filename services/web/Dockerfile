# Use nginx base image
FROM nginx:alpine

# Copy index.html from the current directory to nginx root directory
COPY static/* /usr/share/nginx/html

# Copy nginx configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Command to start nginx when container runs
CMD ["nginx", "-g", "daemon off;"]
