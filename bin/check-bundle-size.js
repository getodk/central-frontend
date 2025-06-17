#!/usr/bin/env node

const { execSync } = require('node:child_process');

const log = (...args) => console.log('[check-bundle-size]', ...args);

const minSize = 5000000;
const maxSize = 6000000;

log('---');
log('Individual file sizes:');
log();
log(' SIZE/b PATH');

let count = 0;
let actualSize = 0;

execSync('find dist/ -type f -exec du -b {} \\;', { encoding:'utf8' })
    .split('\n')
    .filter(line => line)
    .map(line => {
      const [ size, path ] = line.split('\t');
      return { size:Number(size), path };
    })
    .sort((a, b) => a.path > b.path ? 1 : -1)
    .forEach(({ size, path }) => {
      ++count;
      actualSize += size;
      log(size.toString().padStart(7, ' '), path);
    })
    ;

log('---');
log('  files:', count);
log('  minimum size: ', humanSize(minSize));
log('   actual size: ', humanSize(actualSize));
log('  maximum size: ', humanSize(maxSize));
log('---');

if(actualSize < minSize) {
  log('!!!');
  log('!!! Bundle is too small !!!');
  log('!!!');
  log('!!! Please check what may have changed, and either fix');
  log('!!! the issue, or adjust expectations in this script.');
  log('!!!');
  process.exit(1);
}
if(actualSize > maxSize) {
  log('!!!');
  log('!!! Bundle is too big !!!');
  log('!!!');
  log('!!! Please check what may have changed, and either fix');
  log('!!! the issue, or adjust expectations in this script.');
  log('!!!');
  process.exit(1);
}
log('Bundle size looks OK.');

function humanSize(bytes) {
  if(bytes > 1048576) return (bytes / 1048576).toFixed(3).padStart(5, ' ') + ' MB';
  if(bytes >    1024) return (bytes /    1024).toFixed(3).padStart(5, ' ') + ' KB';
  else                return bytes + ' B';
}
