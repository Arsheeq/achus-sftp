#!/bin/bash
if [ "$1" = "run" ] && [ "$2" = "dev" ]; then
    echo "Building frontend..."
    /usr/bin/npm run build --prefix /home/runner/workspace
    echo "Starting Python backend..."
    cd /home/runner/workspace
    exec uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload
else
    exec /usr/bin/npm "$@"
fi
