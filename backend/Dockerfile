# ---- SuckIt Video Downloader Backend ----
FROM python:3.12-slim

LABEL maintainer="SuckIt" \
      description="FastAPI backend for SuckIt video downloader"

# Install FFmpeg (required by yt-dlp for merging video+audio streams).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user.
RUN useradd --create-home --shell /bin/bash suckit

WORKDIR /app

# Install Python dependencies first (layer caching).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source.
COPY models.py downloader.py main.py ./

# Create the downloads directory with correct ownership.
RUN mkdir -p /tmp/suckit_downloads && chown suckit:suckit /tmp/suckit_downloads

USER suckit

EXPOSE 8000

# Health check using the /api/health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
