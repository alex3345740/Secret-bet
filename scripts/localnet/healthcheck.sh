#!/usr/bin/env bash
set -euo pipefail

BASE_RPC="${BASE_RPC:-http://127.0.0.1:8899}"
ER_RPC="${ER_RPC:-http://127.0.0.1:7799}"

check_rpc() {
  local url="$1"
  local label="$2"
  local payload='{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
  if curl -fsS --max-time 3 -H "Content-Type: application/json" -d "$payload" "$url" >/dev/null 2>&1; then
    echo "$label healthy at $url"
    return 0
  fi
  echo "$label failed healthcheck at $url" >&2
  return 1
}

check_rpc "$BASE_RPC" "Base validator"
check_rpc "$ER_RPC" "Ephemeral validator"

echo "Localnet healthcheck passed."
