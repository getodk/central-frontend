#!/bin/bash -eu
set -o pipefail
shopt -s inherit_errexit || true

git ls-files -z -- . \
    ':!:packages/common/src/fixtures/test-javarosa/resources/smoketests/whova_form.xml' \
    ':!:packages/common/src/fixtures/test-javarosa/resources/wards.xml' \
    ':!:package-lock.json' \
| xargs -0 ls -l -- \
| awk '
  BEGIN {
    print "[check-for-large-files] Checking for large files...";

    limits["jpg"]   =  250000
    limits["mp3"]   =  200000
    limits["mp4"]   = 1000000
    limits["png"]   =  600000
    limits["svg"]   =    5000
    limits["xml"]   =  400000

    default_limit   =  120000
    icomoon_limit   = 1000000
    transifex_limit =  300000
  }

  {
    file_size = $5;
    file_path = file_extension = $9;
    sub(/.+\./, "", file_extension);

    limit = file_path ~ /icomoon/ ? icomoon_limit :
            file_path ~ /^apps\/central\/transifex\// ? transifex_limit :
            file_extension in limits ? limits[file_extension] : default_limit;

    if(file_size > limit) {
      ++n;
      print file_size "\t" file_path;
    }
  }

  END {
    if(n>0) {
      print "[check-for-large-files] !!! " n " LARGE FILE(S) FOUND";
      exit 1;
    } else {
      print "[check-for-large-files] No large files found ✅";
    }
  }
'
