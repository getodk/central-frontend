#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

cd "$(dirname "$0")/.."

mkdir -p test-results playwright-report

PLAYWRIGHT_VERSION=$(node -p "require('../../package-lock.json').packages['node_modules/@playwright/test'].version")
HOST_UID=$(id -u)
HOST_GID=$(id -g)
export PLAYWRIGHT_VERSION HOST_UID HOST_GID

exec docker compose run --build --rm e2e "$@"
