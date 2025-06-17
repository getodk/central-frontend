#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit

minSize=3276
maxSize=4096

log() { echo >&2 "[$(basename "$0")] $*"; }

humanSize() {
  if [[ "$1" -gt 1024 ]]; then
    echo "$(bc <<< "scale=3; $1 / 1024") MB"
  else
    echo "$1 KB"
  fi
}

log "---"
log "Individual file sizes:"
find dist/ -type f -exec du -b {} \; |
    sort -k2 |
    awk '
      BEGIN {
        print  "[check-bundle-size.sh]  SIZE/b PATH"
      }
      { printf "[check-bundle-size.sh] %7s %s\n", $1, $2 }
    '

actualSize="$(du -s dist/ | cut -f1)"

log "---"
log "  minimum size: $(humanSize "$minSize")"
log "   actual size: $(humanSize "$actualSize")"
log "  maximum size: $(humanSize "$maxSize")"
log "---"

if [[ "$actualSize" -lt "$minSize" ]]; then
  log "!!!"
  log "!!! Bundle is too small !!!"
  log "!!!"
  log "!!! Please check what may have changed, and either fix"
  log "!!! the issue, or adjust expectations in this script."
  log "!!!"
  exit 1
fi

if [[ "$actualSize" -gt "$maxSize" ]]; then
  log "!!!"
  log "!!! Bundle is too big !!!"
  log "!!!"
  log "!!! Please check what may have changed, and either fix"
  log "!!! the issue, or adjust expectations in this script."
  log "!!!"
  exit 1
fi

log "Bundle size looks OK."
