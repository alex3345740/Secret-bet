#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

USER_HOME="$(getent passwd "$(id -un)" | cut -d: -f6)"
export NVM_DIR="${NVM_DIR:-$USER_HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
fi

export SOLANA_CLUSTER=localnet
export EPHEMERAL_PROVIDER_ENDPOINT="${EPHEMERAL_PROVIDER_ENDPOINT:-http://127.0.0.1:7799}"
export EPHEMERAL_WS_ENDPOINT="${EPHEMERAL_WS_ENDPOINT:-ws://127.0.0.1:7800}"
export PROVIDER_ENDPOINT="${PROVIDER_ENDPOINT:-http://127.0.0.1:8899}"
export WS_ENDPOINT="${WS_ENDPOINT:-ws://127.0.0.1:8900}"

anchor test \
  --provider.cluster localnet \
  --skip-local-validator \
  --skip-build \
  --skip-deploy
