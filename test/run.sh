#!/bin/bash -eu
set -o pipefail

cp index.html public/
output=$(mktemp)
trap 'rm -f -- public/index.html "$output"' EXIT
NODE_ENV=test karma start | tee "$output"
# Search for: warnings from console.warn(), including Vue warnings; Sass
# warnings; and warnings from Karma.
if grep -F -e 'WARN LOG:' -e 'ERROR LOG:' -e 'Module Warning' -e 'WARN [web-server]:' -C5 "$output"; then
	# Reset the text format in case the search results contained formatted text.
	tput sgr0
	echo
	echo 'All tests passed, but there were warnings: see above.'
	exit 1
fi
