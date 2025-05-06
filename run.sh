#!/bin/bash

# Get current directory
CURRENT_DIR=$(pwd)

echo "======================================"
echo "Running in: $CURRENT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Get it from https://nodejs.org/"
    exit 1
fi

# Display Node version
NODE_VER=$(node -v)
echo "Detected Node.js Version: $NODE_VER"
echo "======================================"

# Run npm install
echo "Running npm install..."
npm install && npm start

# Optional audit warning
echo "------------------------------------"
echo "Note: Run 'npm audit fix' or 'npm audit fix --force' to resolve vulnerabilities."
echo "------------------------------------"

echo "Script finished." 