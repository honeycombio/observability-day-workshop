# Use nginx base image
FROM nginx:alpine

# Copy index.html from the current directory to nginx root directory
COPY index.html /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to start nginx when container runs
CMD ["nginx", "-g", "daemon off;"]
