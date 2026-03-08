FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create data directory
RUN mkdir -p /app/backend/data

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Start server - uses Railway's $PORT env var (default 8000)
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
