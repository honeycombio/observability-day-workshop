FROM python:3.11-slim

WORKDIR /app

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create shared-data directory
RUN mkdir -p ../shared-data

# Copy shared-data files
COPY ../shared-data/users.db ../shared-data/

ENV PORT=10119
EXPOSE 10119

CMD ["python", "app.py"]
