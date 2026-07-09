#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

log() { echo >&2 "[transifex:lint] $*"; }

if bash -c 'diff transifex/strings_en.json <(node bin/transifex/restructure.js)'; then
  log "Completed OK."
else
  log "!!!"
  log "!!! Failed.  To fix, run:"
  log "!!!"
  log "!!!     npm run transifex:fix"
  log "!!!"
  exit 1
fi
