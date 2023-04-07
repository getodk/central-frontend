#!/bin/bash -eu
set -o pipefail

output=$(mktemp)
trap 'rm -- "$output"' EXIT
NODE_ENV=test karma start | tee "$output"
if grep -F -e 'WARN LOG:' -e 'WARN [web-server]:' -C5 "$output"; then
	echo
	echo 'All tests passed, but there were warnings: see above.'
	exit 1
fi
