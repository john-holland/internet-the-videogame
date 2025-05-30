#!/bin/bash

# Exit on error
set -e

echo "Setting up Internet the Video Game..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
# Server Configuration
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=internet_game
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Wayback Machine API
WAYBACK_API_KEY=your_api_key
EOL
  echo "Please update the .env file with your actual configuration values."
fi

# Create database if it doesn't exist
echo "Setting up database..."
psql -U postgres -c "CREATE DATABASE internet_game;" || true

# Run database setup script
echo "Running database setup script..."
npx ts-node src/server/db/setup.ts

echo "Setup completed successfully!"
echo "You can now start the development server with 'npm run dev'" 