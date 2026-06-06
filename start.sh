#!/bin/bash
# Start the proxy in background
cd /app/opencode-proxy
node server.mjs &

# Wait for proxy to be ready
sleep 3

# Start Cod3x
cd /app
node server.mjs
