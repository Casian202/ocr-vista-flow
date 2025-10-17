#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
VENV_DIR="${REPO_ROOT}/.venv"
PYTHON_BIN="python3"

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "Error: python3 is required but not installed or not on PATH." >&2
  exit 1
fi

if [ ! -d "${BACKEND_DIR}" ]; then
  echo "Error: backend directory not found at ${BACKEND_DIR}." >&2
  exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
  echo "Creating virtual environment at ${VENV_DIR}" >&2
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

"${VENV_DIR}/bin/python" -m pip install --upgrade pip
"${VENV_DIR}/bin/python" -m pip install -r "${BACKEND_DIR}/requirements.txt"

ENV_FILE="${BACKEND_DIR}/.env"
EXAMPLE_ENV_FILE="${BACKEND_DIR}/.env.example"
if [ -f "${EXAMPLE_ENV_FILE}" ] && [ ! -f "${ENV_FILE}" ]; then
  cp "${EXAMPLE_ENV_FILE}" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from template. Update values as needed." >&2
fi

echo "Backend environment ready. Activate it with: source ${VENV_DIR}/bin/activate" >&2
