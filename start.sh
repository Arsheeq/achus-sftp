#!/bin/bash
set -e

# Install npm dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# Build the React frontend
echo "Building frontend..."
npx vite build

# Start the Python backend
echo "Starting Python backend..."
uv run uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload
