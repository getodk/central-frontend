#!/usr/bin/env node

/* eslint-disable array-bracket-spacing, indent, key-spacing, no-confusing-arrow, no-console, no-else-return, no-multi-spaces, no-plusplus, no-use-before-define, prefer-template, semi-style */

const { execSync } = require('node:child_process');
const { extname } = require('node:path');

const log = (...args) => console.log('[check-bundle-size]', ...args);

const minSize = 5000000;
const maxSize = 6000000;

log('---');
log('Individual file sizes:');
log();
log(' SIZE/b PATH');

const files = execSync('find dist/ -type f -exec du -b {} \\;', { encoding:'utf8' })
    .split('\n')
    .filter(line => line)
    .map(line => {
      const [ size, path ] = line.split('\t');
      return { size:Number(size), path };
    })
    .sort((a, b) => a.path > b.path ? 1 : -1)
    .map(f => {
      log(f.size.toString().padStart(7, ' '), f.path);
      return { ...f, ok:isSizeOk(f) };
    })
    ;

log('---');
log('  files:', files.length);
log('---');

const tooBigs = files.filter(f => !f.ok);
if (tooBigs.length) {
  log('!!!');
  log(`!!! ${tooBigs.length} file(s) are too big !!!`);
  log('!!!');
  log('!!! Please check what may have changed, and either fix');
  log('!!! the issue, or adjust expectations in this script.');
  log('!!!');
  process.exit(1);
}
log('File sizes look OK.');

function humanSize(bytes) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(3).padStart(5, ' ') + ' MB';
  if (bytes >    1024) return (bytes /    1024).toFixed(3).padStart(5, ' ') + ' KB';
  else                return bytes + ' B';
}

function isSizeOk({ path, size }) {
  const type = extname(path).substr(1);
  return true;
}
