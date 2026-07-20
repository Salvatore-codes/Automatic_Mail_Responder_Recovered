#!/bin/bash
# ------------------------------------------------------------------------------
# TROFEO SKU-MATCHER — ORACLE CLOUD ALWAYS FREE 1-CLICK DEPLOYMENT SCRIPT
# ------------------------------------------------------------------------------
set -e

echo "=========================================================================="
echo "          TROFEO HARDWARE — ORACLE CLOUD 24/7 DEPLOYMENT SETUP"
echo "=========================================================================="

# Update Ubuntu & Install Docker
echo "[1/4] Installing Docker & Docker Compose..."
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git curl

sudo systemctl enable docker
sudo systemctl start docker

# Allow current user to run docker without sudo
sudo usermod -aG docker $USER || true

# Build Docker image
echo "[2/4] Building Docker container (fast build)..."
docker-compose build

# Start services
echo "[3/4] Launching Web Server & Email Listener in 24/7 background mode..."
docker-compose up -d

# Check status
echo "[4/4] Verifying deployment..."
sleep 3
docker ps

echo "=========================================================================="
echo " SUCCESS! Your SKU-Matcher is now running 24/7 on Oracle Cloud Always Free!"
echo " Web Dashboard: http://$(curl -s ifconfig.me):8085"
echo "=========================================================================="
