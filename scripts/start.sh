#!/bin/bash

# Exit on error
set -e

echo "Starting Internet the Video Game server..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please run setup.sh first."
  exit 1
fi

# Start Redis if not running
if ! pgrep redis-server > /dev/null; then
  echo "Starting Redis server..."
  redis-server &
fi

# Start PostgreSQL if not running
if ! pgrep postgres > /dev/null; then
  echo "Starting PostgreSQL server..."
  pg_ctl -D /usr/local/var/postgres start
fi

# Start the development server
echo "Starting development server..."
npm run dev 