#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit

find dist/ -type f -exec du -b {} \; |
    sort -k2 |
    awk -f bin/check-bundle-size.awk
