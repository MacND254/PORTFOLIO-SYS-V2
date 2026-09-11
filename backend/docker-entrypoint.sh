#!/bin/sh
set -eu

# Schema synchronization now runs as a Railway pre-deploy command
# (`npx prisma db push`) before this container starts, so DATABASE_URL has
# fully resolved by the time the app boots. This entrypoint only seeds data
# and starts the server.

node dist/database/seed.js
exec node dist/server.js
