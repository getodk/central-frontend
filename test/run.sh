#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit

# Normally, index.html is housed at the root of the repository for Vite, but
# here we move it to public/, where Vue CLI expects it.
cp index.html public/
output=$(mktemp)
trap 'rm -- public/index.html "$output"' EXIT

NODE_ENV="test" karma start | tee "$output"

# Search for: warnings from console.warn(), including Vue warnings; Sass
# warnings; and warnings from Karma.
set -- -F -e 'WARN LOG:' -e 'ERROR LOG:' -e 'Module Warning' -e 'WARN [web-server]:' "$output"
warnings=$(grep -c "$@")
if (( warnings > 2)); then
  echo ----- WARNINGS: -----
  grep -C5 "$@"
  echo
  echo "All tests passed, but there were $warnings warnings: see above."
  exit 1
elif (( warnings > 0 )); then
  echo "There were $warnings warnings, which is within the accepted threshold."
fi
