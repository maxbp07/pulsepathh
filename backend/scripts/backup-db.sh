#!/usr/bin/env bash
# PulsePath — PostgreSQL backup (pg_dump + gzip)
#
# Usage:
#   From backend/:     ./scripts/backup-db.sh
#   Custom backup dir: BACKUP_DIR=/var/backups/pulsepath ./scripts/backup-db.sh
#   Cron (daily 02:00):
#     0 2 * * * cd /opt/pulsepath/backend && ./scripts/backup-db.sh >> /var/log/pulsepath-backup.log 2>&1
#
# Requires: pg_dump, gzip, DATABASE_URL in environment or backend/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${BACKEND_DIR}/backups}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
OUTPUT_FILE="${BACKUP_DIR}/pulsepath_${TIMESTAMP}.sql.gz"

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "${BACKEND_DIR}/.env" ]]; then
  export DATABASE_URL="$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set. Export it or add to ${BACKEND_DIR}/.env" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

pg_dump "${DATABASE_URL}" | gzip > "${OUTPUT_FILE}"

echo "Backup written to ${OUTPUT_FILE}"
