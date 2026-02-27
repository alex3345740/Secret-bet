WSL_PREFIX = wsl -d Ubuntu -- bash -lc
WSL_PROJECT_DIR = /mnt/c/Users/Adminstrator/Downloads/secretbet/hidden-bet

.PHONY: bootstrap-wsl
bootstrap-wsl:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/wsl/bootstrap.sh"

.PHONY: wsl-check
wsl-check:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/wsl/check_env.sh"

.PHONY: localnet-up
localnet-up:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/up.sh"

.PHONY: localnet-down
localnet-down:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/down.sh"

.PHONY: localnet-health
localnet-health:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/healthcheck.sh"

.PHONY: build
build:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && anchor build"

.PHONY: deploy-localnet
deploy-localnet:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/deploy.sh"

.PHONY: test-chain
test-chain:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/test.sh"

.PHONY: test-chain-devnet
test-chain-devnet:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/devnet/test.sh"

.PHONY: report-localnet
report-localnet:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/localnet/report.sh"

.PHONY: install-app
install-app:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR)/app && yarn install"

.PHONY: test-app
test-app:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR)/app && yarn test"

.PHONY: build-app
build-app:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR)/app && yarn build"

.PHONY: dev-app
dev-app:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR)/app && yarn dev"

.PHONY: deploy-devnet
deploy-devnet:
	$(WSL_PREFIX) "cd $(WSL_PROJECT_DIR) && bash scripts/devnet/deploy.sh"

.PHONY: test-all-localnet
test-all-localnet: test-chain test-app
