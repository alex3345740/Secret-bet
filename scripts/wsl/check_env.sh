#!/usr/bin/env bash
set -euo pipefail

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "Checking WSL toolchain..."

USER_HOME="$(getent passwd "$(id -un)" | cut -d: -f6)"
export NVM_DIR="${NVM_DIR:-$USER_HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
fi

if ! command_exists rustup; then
  echo "Missing rustup. Install Rust toolchain first." >&2
  exit 1
fi
if ! command_exists solana; then
  echo "Missing solana CLI." >&2
  exit 1
fi
if ! command_exists anchor; then
  echo "Missing anchor CLI." >&2
  exit 1
fi
if ! command_exists mb-test-validator && ! command_exists solana-test-validator; then
  echo "Missing base validator binary. Install Solana CLI or @magicblock-labs/ephemeral." >&2
  exit 1
fi
if ! command_exists ephemeral-validator; then
  echo "Missing ephemeral-validator. Install with: npm install -g @magicblock-labs/ephemeral-validator" >&2
  exit 1
fi
if ! command_exists node; then
  echo "Missing node. Run scripts/wsl/bootstrap.sh." >&2
  exit 1
fi
if ! command_exists yarn; then
  echo "Missing yarn. Run scripts/wsl/bootstrap.sh." >&2
  exit 1
fi

rustup show >/dev/null
solana --version
anchor --version
if command_exists mb-test-validator; then
  mb-test-validator --version || true
fi
ephemeral-validator --version || true
node --version
yarn --version
echo "WSL toolchain check passed."
