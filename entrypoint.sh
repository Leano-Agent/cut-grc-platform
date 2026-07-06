#!/bin/sh
echo "=== Ngome Backend Entrypoint ==="
echo "Running migrations..."
node src/database/migrations/prod-migrate.js
echo "Migrations completed successfully"
echo "Starting server..."
exec node dist/server.js
