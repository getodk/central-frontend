#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit

log() { echo >&2 "[$(basename "$0")] $*"; }

fatal_error() {
  log "!!!"
  log "!!! $*"
  log "!!!"
  exit 1;
}
downloadAndVerify() {
  fileName="$1"
  expectedDownloadHash="$2"
  expectedExeHash="$3"

  wget "https://www.jonof.id.au/files/kenutils/$fileName"

  log "Verifying download integrity..."
  [[ $(sha256sum "$fileName" | cut -d" " -f1) = "$expectedDownloadHash" ]]

  log "Extracting executable..."
  case "$fileName" in
    *.tar.gz) tar -xf "$fileName" ;;
    *.zip)    unzip   "$fileName" ;;
    *) fatal_error "Unsupported file format for $fileName" ;;
  esac

  pngoutExe="$(find . -type f -name pngout)"

  log "Verifying executable integrity..."
  [[ $(sha256sum "$pngoutExe" | cut -d" " -f1) = "$expectedExeHash" ]]
}
ensurePngout() {
  if command -v pngout &> /dev/null; then
    log "Local pngout found."
    pngoutExe=pngout
  else
    log "Local pngout not found; downloading..."

    tmpDir="$(mktemp -d)"
    cd "$tmpDir"

    case "$(uname -s)" in
      Linux*)   downloadAndVerify pngout-20200115-linux.tar.gz \
                    ac38bba6f0de29033de866538c3afa64341319b695bbe388efbc5fd9e830e928 \
                    c509286fccedd7529b32dfdee2b39906f06d35350034df6dfbf75a4c7dc9a0b5 ;;
      Darwin*)  downloadAndVerify pngout-20230322-mac.zip \
                    2e3eb79345206040ae3a0d0d0ecfe9ad01d92fe5002b8a1676a65632a56840e1 \
                    1981cd0aadc6b2f70353f41d483810285b67ad282cc9cf8877f79d87e33f7c4a ;;
      *) fatal_error "Unsupported operating system?" ;;
    esac

    cd -
  fi
}

if [[ "${1-}" = "--fix" ]]; then
  fix=true
  log "--fix requested; checking pngout is available..."
  ensurePngout
  tmpHashes="$(mktemp)"
else
  fix=false
fi

touch .image-hashes
willFail=false
for target in $(git ls-files '*.png'); do
  log "Checking image: $target ..."

  expectedHash="$(grep "$target" .image-hashes | cut -d: -f2 || echo '<no previous hash>')"
  actualHash="$(sha256sum "$target" | awk '{print $1}')"

  if [[ "$expectedHash" = "$actualHash" ]]; then
    log "  Hashes match OK."
  else
    log "  Hash mismatch:"
    log "    expected: $expectedHash"
    log "      actual: $actualHash"

    if [[ "$fix" = true ]]; then
      log "  Compressing image..."

      # pngout exit codes:
      #   0: success
      #   1: true error
      #   2: "unable to compress further"
      "$pngoutExe" "$target" ||
          [[ $? -eq 2 ]] ||
          fatal_error "An unexpected error occurred while executing $pngoutExe"

      log "  Updating hash..."
      cat >"$tmpHashes" \
          <(grep -v "^$target:" .image-hashes) \
          <(echo "$target:$(sha256sum "$target" | awk '{print $1}')")
      sort "$tmpHashes" > .image-hashes
    else
      willFail=true
    fi
  fi
done

if [[ $willFail = true ]]; then
  log "!!!"
  log "!!! To fix errors, re-run with the --fix flag:"
  log "!!!"
  log "!!!     $0 --fix"
  log "!!!"
  exit 1
fi

log "All OK."
