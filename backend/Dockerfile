FROM python:3.11-slim

# Prevent Python from writing .pyc and buffer standard out/err
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install security updates and curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged runtime user
RUN groupadd -g 1001 seamas && \
    useradd -u 1001 -g seamas -s /bin/bash -m seamas

# Install Python requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source code
COPY backend /app/backend

# Set proper ownership and switch to unprivileged user
RUN chown -R seamas:seamas /app
USER seamas

WORKDIR /app/backend

# Expose FastAPI service port
EXPOSE 8000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
