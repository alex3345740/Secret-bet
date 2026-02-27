#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$ROOT_DIR/.localnet"
BASE_PID_FILE="$STATE_DIR/base-validator.pid"
EPHEMERAL_PID_FILE="$STATE_DIR/ephemeral-validator.pid"
BASE_LOG="$STATE_DIR/base-validator.log"
EPHEMERAL_LOG="$STATE_DIR/ephemeral-validator.log"
BASE_HOST="${BASE_HOST:-127.0.0.1}"
BASE_RPC_PORT="${BASE_RPC_PORT:-8899}"
BASE_WS_PORT="${BASE_WS_PORT:-8900}"
ER_HOST="${ER_HOST:-127.0.0.1}"
ER_RPC_PORT="${ER_RPC_PORT:-7799}"
BASE_LEDGER_DIR="${BASE_LEDGER_DIR:-/tmp/hidden-bet-base-ledger}"
EPHEMERAL_STORAGE_DIR="${EPHEMERAL_STORAGE_DIR:-/tmp/hidden-bet-ephemeral-ledger}"
BASE_RPC="http://${BASE_HOST}:${BASE_RPC_PORT}"
BASE_WS="ws://${BASE_HOST}:${BASE_WS_PORT}"
ER_RPC="http://${ER_HOST}:${ER_RPC_PORT}"

# Ensure npm global binaries installed under nvm are available (e.g. ephemeral-validator).
USER_HOME="$(getent passwd "$(id -un)" | cut -d: -f6)"
export NVM_DIR="${NVM_DIR:-$USER_HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
fi

mkdir -p "$STATE_DIR"

is_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

wait_for_rpc() {
  local url="$1"
  local label="$2"
  local retries="${3:-40}"
  local delay="${4:-0.5}"
  local payload='{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

  for _ in $(seq 1 "$retries"); do
    if curl -fsS --max-time 2 -H "Content-Type: application/json" -d "$payload" "$url" >/dev/null 2>&1; then
      echo "$label is healthy at $url"
      return 0
    fi
    sleep "$delay"
  done

  echo "Timed out waiting for $label at $url" >&2
  return 1
}

wait_for_rpc_or_process_exit() {
  local url="$1"
  local label="$2"
  local pid="$3"
  local log_file="$4"
  local retries="${5:-120}"
  local delay="${6:-0.5}"
  local payload='{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

  for _ in $(seq 1 "$retries"); do
    if curl -fsS --max-time 2 -H "Content-Type: application/json" -d "$payload" "$url" >/dev/null 2>&1; then
      echo "$label is healthy at $url"
      return 0
    fi

    if ! is_running "$pid"; then
      echo "$label exited before becoming healthy. Recent log output:" >&2
      tail -n 40 "$log_file" >&2 || true
      return 1
    fi

    sleep "$delay"
  done

  echo "Timed out waiting for $label at $url" >&2
  tail -n 40 "$log_file" >&2 || true
  return 1
}

wait_for_tcp() {
  local host="$1"
  local port="$2"
  local label="$3"
  local retries="${4:-40}"
  local delay="${5:-0.5}"

  for _ in $(seq 1 "$retries"); do
    if (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1; then
      echo "$label is reachable at ${host}:${port}"
      return 0
    fi
    sleep "$delay"
  done

  echo "Timed out waiting for $label at ${host}:${port}" >&2
  return 1
}

start_base_validator() {
  if [[ -f "$BASE_PID_FILE" ]]; then
    local old_pid
    old_pid="$(cat "$BASE_PID_FILE")"
    if is_running "$old_pid"; then
      echo "Base validator already running (pid $old_pid)."
      return 0
    fi
    rm -f "$BASE_PID_FILE"
  fi

  local cmd="${BASE_VALIDATOR_CMD:-mb-test-validator}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [[ "$cmd" != "solana-test-validator" ]] && command -v solana-test-validator >/dev/null 2>&1; then
      cmd="solana-test-validator"
    elif [[ "$cmd" != "mb-test-validator" ]] && command -v mb-test-validator >/dev/null 2>&1; then
      cmd="mb-test-validator"
    else
      echo "No base validator binary found (tried $cmd, solana-test-validator, mb-test-validator)." >&2
      return 1
    fi
  fi

  echo "Starting base validator with $cmd..."
  nohup "$cmd" --reset --ledger "$BASE_LEDGER_DIR" >"$BASE_LOG" 2>&1 &
  local pid=$!
  echo "$pid" >"$BASE_PID_FILE"
  wait_for_rpc "$BASE_RPC" "Base validator"
  wait_for_tcp "$BASE_HOST" "$BASE_WS_PORT" "Base validator WS"
}

start_ephemeral_validator() {
  if [[ -f "$EPHEMERAL_PID_FILE" ]]; then
    local old_pid
    old_pid="$(cat "$EPHEMERAL_PID_FILE")"
    if is_running "$old_pid"; then
      echo "Ephemeral validator already running (pid $old_pid)."
      return 0
    fi
    rm -f "$EPHEMERAL_PID_FILE"
  fi

  if ! command -v ephemeral-validator >/dev/null 2>&1; then
    echo "Missing ephemeral-validator. Install via: npm install -g @magicblock-labs/ephemeral-validator" >&2
    return 1
  fi

  echo "Starting MagicBlock ephemeral validator..."
  rm -rf "$EPHEMERAL_STORAGE_DIR"
  nohup env RUST_LOG=info ephemeral-validator \
    --lifecycle "${ER_LIFECYCLE:-ephemeral}" \
    --storage "$EPHEMERAL_STORAGE_DIR" \
    --remotes "$BASE_RPC" \
    --remotes "$BASE_WS" \
    -l "${ER_HOST}:${ER_RPC_PORT}" >"$EPHEMERAL_LOG" 2>&1 &
  local pid=$!
  echo "$pid" >"$EPHEMERAL_PID_FILE"
  wait_for_rpc_or_process_exit "$ER_RPC" "Ephemeral validator" "$pid" "$EPHEMERAL_LOG"
}

start_base_validator
start_ephemeral_validator

echo "Localnet stack is up."
echo "Base RPC: $BASE_RPC"
echo "Base WS:  $BASE_WS"
echo "ER RPC:   $ER_RPC"
