function humanSize(bytes) {
  if(bytes > 1048576) return sprintf("%6.3f MB", bytes / 1048576)
  if(bytes >    1024) return sprintf("%6.3f KB", bytes /    1024)
  else             return bytes " B"
}

BEGIN {
  minSize = 5000000
  maxSize = 6000000

  print "[check-bundle-size.sh] ---"
  print "[check-bundle-size.sh] Individual file sizes:";
  print "[check-bundle-size.sh]"
  print "[check-bundle-size.sh]  SIZE/b PATH";
}

{
  printf "[check-bundle-size.sh] %7s %s\n", $1, $2;

  ++count
  actualSize += $1
}

END {
  print "[check-bundle-size.sh] ---"
  print "[check-bundle-size.sh]   files: " count
  print "[check-bundle-size.sh]   minimum size: " humanSize(minSize);
  print "[check-bundle-size.sh]    actual size: " humanSize(actualSize)
  print "[check-bundle-size.sh]   maximum size: " humanSize(maxSize)
  print "[check-bundle-size.sh] ---"

  if(actualSize < minSize) {
    print "[check-bundle-size.sh] !!!"
    print "[check-bundle-size.sh] !!! Bundle is too small !!!"
    print "[check-bundle-size.sh] !!!"
    print "[check-bundle-size.sh] !!! Please check what may have changed, and either fix"
    print "[check-bundle-size.sh] !!! the issue, or adjust expectations in this script."
    print "[check-bundle-size.sh] !!!"
    exit 1
  }
  if(actualSize > maxSize) {
    print "[check-bundle-size.sh] !!!"
    print "[check-bundle-size.sh] !!! Bundle is too big !!!"
    print "[check-bundle-size.sh] !!!"
    print "[check-bundle-size.sh] !!! Please check what may have changed, and either fix"
    print "[check-bundle-size.sh] !!! the issue, or adjust expectations in this script."
    print "[check-bundle-size.sh] !!!"
    exit 1
  }

  print "[check-bundle-size.sh] Bundle size looks OK."
}
