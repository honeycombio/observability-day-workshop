# Use the official Python image as a base
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install Flask and other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Expose port to the outside world
EXPOSE 10115

ENV FLASK_APP=server.py

# Command to run the Flask application
# INSTRUMENTATION: the metrics are noisy duplication of a tiny portion of trace data,
#  so add: "--metrics_exporter", "none", after "opentelemetry-instrument"
CMD ["opentelemetry-instrument", "--metrics_exporter", "none", "flask", "run", "-p 10115", "--host=0.0.0.0" ]
