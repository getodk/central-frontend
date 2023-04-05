#!/bin/bash -eu
set -o pipefail

NODE_ENV=test karma start | tee test/output.txt
if grep -F -e 'WARN LOG:' -e 'WARN [web-server]:' -C5 test/output.txt; then
	echo
	echo 'All tests passed, but there were warnings: see above.'
	exit 1
fi
rm test/output.txt
