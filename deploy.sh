#!/bin/bash

# Stop running server if any
pm2 stop inventory-backend || true

# Clean install
npm run clean
npm install

# Copy environment variables
cp .env.production .env

# Start server with PM2
pm2 start server.js --name "inventory-backend" --env production 