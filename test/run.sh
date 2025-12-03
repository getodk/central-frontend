#!/bin/bash -eu
set -o pipefail

# Normally, index.html is housed at the root of the repository for Vite, but
# here we move it to public/, where Vue CLI expects it.
cp index.html public/
output=$(mktemp)
trap 'rm -- public/index.html "$output"' EXIT

# We've been running into issues trying to run all tests at once in CircleCI.
# Instead, we'll run tests in batches.
if [[ "${CIRCLECI-}" = 'true' ]]; then
	# There are many tests of components whose name starts with "Form" (F) or
	# "Submission" (S). There are also many tests of functions whose name starts
	# with "create" (c) or "use" (u).
	set -- F S '[cu]' '[^FScu]'
else
	set -- .
fi
for pattern in "$@"; do
	pattern="^$pattern"
	echo
	echo "Running tests that match the pattern $pattern"
	NODE_ENV=test TEST_PATTERN="$pattern" karma start | tee "$output"

	# Search for: warnings from console.warn(), including Vue warnings; Sass
	# warnings; and warnings from Karma.
	set -- -F -e 'WARN LOG:' -e 'ERROR LOG:' -e 'Module Warning' -e 'WARN [web-server]:' "$output"
	warnings=$(grep -c "$@")
	if (( $warnings > 2)); then
		grep -C5 "$@"
		# Reset the text format in case the search results contained formatted text.
		tput sgr0
		echo
		echo "All tests passed, but there were $warnings warnings: see above."
		exit 1
	elif (( $warnings > 0 )); then
		echo "There were $warnings warnings, which is within the accepted threshold."
	fi

	# Give the machine a little time to reclaim resources.
	[[ "${CIRCLECI-}" = 'true' ]] && sleep 3
done
