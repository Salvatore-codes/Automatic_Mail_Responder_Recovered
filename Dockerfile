FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (Tesseract OCR, Poppler, Supervisor)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    ffmpeg \
    libsm6 \
    libxext6 \
    supervisor \
    git \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create persistent data directory
RUN mkdir -p /app/data /app/static/quotes /app/mock_outbox

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8085 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
