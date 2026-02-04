#!/bin/bash -eux
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
awk '
  BEGIN { count = 0 }
  /WARN LOG:/          { ++count }
  /ERROR LOG:/         { ++count }
  /Module Warning/     { ++count }
  /WARN [web-server]:/ { ++count }
  END {
    if(count > 2) {
      print "All tests passed, but there were " warnings " warnings: see above."
      exit 1
    }
    echo "There were " warnings " warnings, which is within the accepted threshold."
  }
' "$output"
