FROM python:3.9-slim

WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install Flask and other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

EXPOSE 10118

ENV FLASK_APP=server.py

CMD ["opentelemetry-instrument", \
    "--metrics_exporter", "none", \
    "flask", "run", \
    "-p 10118", \
    "--host=0.0.0.0"]

