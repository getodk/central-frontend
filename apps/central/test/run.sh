#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

# Normally, index.html is housed at the root of the repository for Vite, but
# here we move it to public/, where Vue CLI expects it.
cp ../../index.html ../../public/
output=$(mktemp)
trap 'rm -- ../../public/index.html "$output"' EXIT

vitest run "$@" | tee "$output"

# Search for:
#
#   - Warnings from console.warn(), including Vue warnings
#   - Sass warnings
awk '
  BEGIN { warnings = 0 }
  /stderr/               { ++warnings; print "WARNING: " $0 }
  /ERROR LOG:/           { ++warnings; print "WARNING: " $0 }
  /Module Warning/       { ++warnings; print "WARNING: " $0 }
  END {
    if(warnings > 2) {
      print "All tests passed, but there were " warnings " warnings: see above."
      exit 1
    }
    print "There were " warnings " warnings, which is within the accepted threshold."
  }
' "$output"
