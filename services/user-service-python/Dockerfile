FROM python:3.11-slim

WORKDIR /app

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY services/user-service-python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/user-service-python/ .

ENV PORT=10119
EXPOSE 10119

CMD ["opentelemetry-instrument","--metrics_exporter", "none", "python", "app.py"]
