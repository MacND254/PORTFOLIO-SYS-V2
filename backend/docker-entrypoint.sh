#!/bin/sh
set -eu

# Railway has no Compose-style depends_on. Retry schema synchronization while a
# managed Postgres service finishes becoming reachable. `db push` is used because
# this project currently has a Prisma schema but no committed migrations.
attempt=1
max_attempts=12

until npx prisma db push --skip-generate; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database schema synchronization failed after $attempt attempts." >&2
    exit 1
  fi

  delay=$((attempt * 2))
  echo "Database is not ready; retrying in ${delay}s (${attempt}/${max_attempts})..." >&2
  sleep "$delay"
  attempt=$((attempt + 1))
done

exec node dist/server.js
