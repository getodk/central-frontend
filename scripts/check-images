#!/bin/bash -eu

log() {
  echo "[check-images] $*"
}


if command -v pngout &> /dev/null; then
  log "Local pngout found."
  pngoutExe=pngout
else
  log "Local pngout not found; downloading..."
  tmpDir="$(mktemp -d)"
  cd "$tmpDir"

  wget https://www.jonof.id.au/files/kenutils/pngout-20200115-linux.tar.gz

  log "Verifying download integrity..."
  [[ $(sha256sum pngout-20200115-linux.tar.gz | cut -d" " -f1) = ac38bba6f0de29033de866538c3afa64341319b695bbe388efbc5fd9e830e928 ]]

  log "Extracting executable..."
  tar -xf pngout-20200115-linux.tar.gz

  log "Verifying executable integrity..."
  [[ $(sha256sum pngout-20200115-linux/amd64/pngout | cut -d" " -f1) = c509286fccedd7529b32dfdee2b39906f06d35350034df6dfbf75a4c7dc9a0b5 ]]

  pngoutExe="$tmpDir/pngout-20200115-linux/amd64/pngout"

  cd -
fi

log "Shrinking images..."
# pngout exit codes:
#   0: success
#   1: true error
#   2: "unable to compress further"
find src -type f -name '*.png' | xargs -I{} bash -c "
  '$pngoutExe' {}
  [[ \$? != 1 ]]
"
set -e

log "Checking for changes..."
if [[ "$(git status --porcelain)" != "" ]]; then
  git status
  log "!!!"
  log "!!! Changes detected!"
  log "!!!"
  log "!!! Non-optimised PNGs should not be merged to master."
  log "!!!"
  log "!!! To see these changes locally, run:"
  log "!!!"
  log "!!!     $0"
  log "!!!"
  exit 1
fi

log "Everything looks OK."
