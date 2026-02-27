# Hidden Bet

Hidden Bet is a localnet-first Solana casino MVP with Plinko, Roulette, and Slots.

## Stack
1. Anchor programs under `programs/`
2. Next.js frontend under `app/`
3. MagicBlock ER/PER + VRF integration hooks in on-chain instructions
4. WSL-only compile/localnet/test workflow

## Localnet workflow (WSL)
```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/wsl/bootstrap.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/up.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/healthcheck.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/deploy.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/test.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/report.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/localnet/down.sh"
```

## Frontend commands (WSL)
```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet/app && yarn install"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet/app && yarn test"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet/app && yarn build"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet/app && yarn dev"
```

## Devnet staging fallback (explicit only)
```powershell
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/devnet/deploy.sh"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet && bash scripts/devnet/test.sh"
```

## App routes
1. `/` lobby
2. `/plinko`
3. `/roulette`
4. `/slots`
5. `/fairness`
6. `/history`
7. `/wallet`

## Notes
1. Exact Figma parity target is tracked in `docs/design-system.md`.
2. Source-evidence docs for MagicBlock decisions are in `docs/research/`.
