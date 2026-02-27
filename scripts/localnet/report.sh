#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$ROOT_DIR/.localnet"

echo "Hidden Bet localnet report"
echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo

if [[ -f "$STATE_DIR/base-validator.pid" ]]; then
  echo "Base validator pid: $(cat "$STATE_DIR/base-validator.pid")"
else
  echo "Base validator pid: not running"
fi

if [[ -f "$STATE_DIR/ephemeral-validator.pid" ]]; then
  echo "Ephemeral validator pid: $(cat "$STATE_DIR/ephemeral-validator.pid")"
else
  echo "Ephemeral validator pid: not running"
fi

echo
echo "Recent base-validator log lines:"
tail -n 15 "$STATE_DIR/base-validator.log" 2>/dev/null || true
echo
echo "Recent ephemeral-validator log lines:"
tail -n 15 "$STATE_DIR/ephemeral-validator.log" 2>/dev/null || true
