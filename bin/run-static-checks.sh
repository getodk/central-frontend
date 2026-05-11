#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

log() { echo "[$(basename "$0")] $*"; }

log "Running all static checks..."

for check in ./bin/static-checks/*; do
  "$check"
done

log "All static checks OK."
