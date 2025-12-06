#!/usr/bin/env node

/* eslint-disable array-bracket-spacing, indent, key-spacing, no-confusing-arrow, no-else-return, no-multi-spaces, no-plusplus, no-use-before-define, prefer-template, semi-style */

const { execSync } = require('node:child_process');
const { basename, extname } = require('node:path');

const log = (...args) => console.log('[check-bundle-size]', ...args);

const enableColours = !!process.env.COLORTERM;
const RED  =  '\x1b[31m';
const BOLD =  '\x1b[1m';
const RESET = '\x1b[0m';

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
      const tooBig = isTooBig(f);
      const sizeText = (tooBig ? redBold : normal)(f.size.toString().padStart(7, ' '));
      log(sizeText, f.path);
      return { ...f, tooBig };
    })
    ;

log('---');
log('  files:', files.length);
log('---');

const tooBigs = files.filter(f => f.tooBig);
if (tooBigs.length) {
  log('!!!');
  log(`!!! ${tooBigs.length} file(s) are too big:`);
  log('!!!');
  tooBigs.map(f => log(`!!! * ${f.path}`));
  log('!!!');
  log('!!!');
  log('!!! Please check what may have changed, and either fix');
  log('!!! the issue, or adjust expectations in this script.');
  log('!!!');
  process.exit(1);
}
log('File sizes look OK.');


function isTooBig({ path, size }) {
  // Special cases:
  const simpleName = basename(path).replace(/(-[\w-]{8})+\./, '.');
  switch (simpleName) { // eslint-disable-line default-case
    case 'index.js':             return size >   750_000;
    case 'web-form.js': return size > 3_300_000;
    case 'MapBlock.js': return size > 450_000; // A Web Forms' feature bundle
    case 'geojson-map.js':       return size >   500_000;
  }

  const type = extname(path).substr(1);
  switch (type) { // eslint-disable-line default-case
    case 'css':  return size > 220_000;
    case 'html': return size >   1_200;
    case 'ico':  return size >  16_000;
    case 'js':   return size > 200_000;
    case 'png':  return size > 200_000;
    case 'svg':  return size >  60_000;
    case 'ttf':  return size >  18_000;
    case 'woff': return size >  19_000;
  }
  throw new Error(`No check written for file ${path} yet!  Please review this function.`);
}

function redBold(text) {
  if (!enableColours) return text;
  return [ RED, BOLD, text, RESET ].join('');
}
function normal(text) {
  return text;
}
