#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
USER_HOME="$(getent passwd "$(id -un)" | cut -d: -f6)"

echo "Bootstrapping Hidden Bet workspace in WSL..."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Installing Node 24 via nvm..."
  export NVM_DIR="${NVM_DIR:-$USER_HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
  nvm install 24
  nvm alias default 24
  nvm use 24
fi

export NVM_DIR="${NVM_DIR:-$USER_HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare yarn@stable --activate
fi

if ! command -v ephemeral-validator >/dev/null 2>&1; then
  echo "Installing MagicBlock ephemeral validator package..."
  npm install -g @magicblock-labs/ephemeral-validator
fi

bash "$ROOT_DIR/scripts/wsl/check_env.sh"

if [ -f "$ROOT_DIR/package.json" ]; then
  echo "Installing root workspace dependencies..."
  cd "$ROOT_DIR"
  touch yarn.lock
  YARN_IGNORE_PATH=1 yarn install
fi

echo "Installing frontend dependencies..."
cd "$ROOT_DIR/app"
touch yarn.lock
YARN_IGNORE_PATH=1 yarn install

echo "Bootstrap complete."
