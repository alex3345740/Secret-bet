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

if ! command -v node >/dev/null 2>&1; then
  echo "Node is required for Anchor TS tests. Run scripts/wsl/bootstrap.sh" >&2
  exit 1
fi

npm run test:anchor
