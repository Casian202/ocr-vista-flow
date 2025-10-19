#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: install_backend_service.sh [options]

Options:
  --root PATH           Repository root that contains backend/ (default: auto-detected)
  --service-path PATH   Destination for the systemd unit file (default: /etc/systemd/system/ocr-backend.service)
  --user USER           System user that will run the service (default: www-data)
  --group GROUP         System group for the service (default: same as user)
  --workers N           Gunicorn worker count (default: 4)
  --bind ADDRESS        Gunicorn bind address (default: 127.0.0.1:8000)
  --env-file PATH       Path to .env file (default: <root>/backend/.env)
  --dry-run             Print the rendered unit to stdout instead of writing/installing.
  -h, --help            Show this help message and exit.

Note: This script must run with sufficient privileges to write the service file
and reload systemd (typically via sudo).
USAGE
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE_PATH="/etc/systemd/system/ocr-backend.service"
SERVICE_USER="www-data"
SERVICE_GROUP=""
WORKERS="4"
BIND_ADDRESS="127.0.0.1:8000"
DRY_RUN=false
ROOT_OVERRIDE=""
ENV_FILE_OVERRIDE=""

while (($#)); do
  case "$1" in
    --root)
      ROOT_OVERRIDE="$2"
      shift 2
      ;;
    --service-path)
      SERVICE_PATH="$2"
      shift 2
      ;;
    --user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --group)
      SERVICE_GROUP="$2"
      shift 2
      ;;
    --workers)
      WORKERS="$2"
      shift 2
      ;;
    --bind)
      BIND_ADDRESS="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE_OVERRIDE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [ -n "$ROOT_OVERRIDE" ]; then
  if [ ! -d "$ROOT_OVERRIDE" ]; then
    echo "Error: --root path $ROOT_OVERRIDE does not exist." >&2
    echo "Hint: repo-ul pare să fie la $DEFAULT_ROOT. Rulează scriptul fără --root" >&2
    echo "      sau furnizează calea corectă (ex: --root \"$DEFAULT_ROOT\")." >&2
    exit 1
  fi
  APP_ROOT="$(cd "$ROOT_OVERRIDE" && pwd)"
else
  APP_ROOT="$DEFAULT_ROOT"
fi

if [ ! -d "$APP_ROOT/backend" ]; then
  echo "Error: backend directory not found under $APP_ROOT." >&2
  exit 1
fi

if [ -z "$SERVICE_GROUP" ]; then
  SERVICE_GROUP="$SERVICE_USER"
fi

if [ -n "$ENV_FILE_OVERRIDE" ]; then
  ENV_FILE="$ENV_FILE_OVERRIDE"
else
  ENV_FILE="$APP_ROOT/backend/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: environment file $ENV_FILE does not exist yet." >&2
fi

UNIT_CONTENT=$(sed \
  -e "s#@APP_ROOT@#$APP_ROOT#g" \
  -e "s#@ENV_FILE@#$ENV_FILE#g" \
  -e "s#@WORKERS@#$WORKERS#g" \
  -e "s#@BIND_ADDRESS@#$BIND_ADDRESS#g" \
  -e "s#@SERVICE_USER@#$SERVICE_USER#g" \
  -e "s#@SERVICE_GROUP@#$SERVICE_GROUP#g" \
  "$APP_ROOT/deploy/systemd/ocr-backend.service.template")

if $DRY_RUN; then
  printf '%s\n' "$UNIT_CONTENT"
  exit 0
fi

if [ "$EUID" -ne 0 ]; then
  echo "Error: writing to $SERVICE_PATH requires root privileges." >&2
  exit 1
fi

echo "$UNIT_CONTENT" > "$SERVICE_PATH"
chmod 644 "$SERVICE_PATH"

systemctl daemon-reload
systemctl enable --now "$(basename "$SERVICE_PATH")"

echo "Installed systemd unit at $SERVICE_PATH targeting repository root $APP_ROOT." >&2
