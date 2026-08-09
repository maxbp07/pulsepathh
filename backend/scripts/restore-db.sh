#!/usr/bin/env bash
# PulsePath — PostgreSQL restore (from gzip dump)
#
# Usage:
#   ./scripts/restore-db.sh ./backups/pulsepath_20260717_020000.sql.gz
#   DRY_RUN=1 ./scripts/restore-db.sh backup.sql.gz   # validate only
#
# WARNING: overwrites the target database. Use only in controlled maintenance.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
INPUT="${1:-}"

if [[ -z "${INPUT}" ]] || [[ ! -f "${INPUT}" ]]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "${BACKEND_DIR}/.env" ]]; then
  export DATABASE_URL="$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set." >&2
  exit 1
fi

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "DRY_RUN: backup file exists ($(du -h "${INPUT}" | cut -f1)), DATABASE_URL set."
  gunzip -t "${INPUT}"
  echo "Integrity check OK."
  exit 0
fi

echo "Restoring ${INPUT} → database (5s to cancel)..."
sleep 5
gunzip -c "${INPUT}" | psql "${DATABASE_URL}"
echo "Restore complete."
