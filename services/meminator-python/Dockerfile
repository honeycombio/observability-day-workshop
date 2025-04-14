FROM python:3.9-slim

RUN apt-get update
RUN apt-get install -y imagemagick

# Create a directory for custom fonts
RUN mkdir -p /usr/share/fonts/truetype
# Copy font files from host to container
COPY ./Angkor/*.ttf /usr/share/fonts/truetype/
# Refresh font cache
RUN fc-cache -f -v

WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install Flask and other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

EXPOSE 10116

ENV FLASK_APP=src/server.py

CMD ["opentelemetry-instrument", \
    "--metrics_exporter", "none", \
    "flask", "run", \
    "-p 10116", \
    "--host=0.0.0.0"]