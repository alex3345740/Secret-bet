#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$ROOT_DIR/.localnet"
BASE_PID_FILE="$STATE_DIR/base-validator.pid"
EPHEMERAL_PID_FILE="$STATE_DIR/ephemeral-validator.pid"

stop_pid_file() {
  local pid_file="$1"
  local label="$2"
  if [[ ! -f "$pid_file" ]]; then
    echo "$label pid file not found."
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "Stopping $label (pid $pid)..."
    kill "$pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 20); do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 0.2
    done
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  else
    echo "$label process not running."
  fi

  rm -f "$pid_file"
}

stop_pid_file "$EPHEMERAL_PID_FILE" "Ephemeral validator"
stop_pid_file "$BASE_PID_FILE" "Base validator"

echo "Localnet stack stopped."
