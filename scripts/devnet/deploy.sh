#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Deploying Hidden Bet programs to devnet..."
anchor build
anchor deploy --provider.cluster devnet --program-name hidden_bet_core
anchor deploy --provider.cluster devnet --program-name hidden_bet_plinko
anchor deploy --provider.cluster devnet --program-name hidden_bet_roulette
anchor deploy --provider.cluster devnet --program-name hidden_bet_slots

echo "Devnet deploy completed."

