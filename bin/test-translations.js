#!/usr/bin/env node

const { readdirSync, readFileSync, writeFileSync } = require('node:fs');

const translationDir = './src/locales';
const log = (...args) => console.log(`[translations-test]`, ...args);
const DEFAULT = 'en';

// Convert json5 source file to standard json
writeFileSync(
  `${translationDir}/${DEFAULT}.json`,
  JSON.stringify(eval('_=' + readFileSync(`${translationDir}/${DEFAULT}.json5`, { encoding:'utf8' }))),
);

const base = load(DEFAULT);
const baseKeys = keysFrom(base);

const issues = [];

for(const lang of readdirSync(translationDir).filter(f => f.endsWith('.json')).map(f => f.replace(/.json$/, ''))) {
  if(lang === DEFAULT) continue;

  log('Processing:', lang, '...');
  const langTr = load(lang);

  const thisKeys = keysFrom(langTr);
  const missingKeys = onlyInFirst(baseKeys, thisKeys);
  const extraKeys   = onlyInFirst(thisKeys, baseKeys);
  missingKeys.forEach(key => issues.push({ level:'WARN', lang, key, err:'key:missing' }));
  extraKeys  .forEach(key => issues.push({ level:'WARN', lang, key, err:'key:extra' }));

  const ignoreList = [ ...missingKeys, ...extraKeys ];
  const thisInterpolations = interpolationsFrom(langTr, ignoreList);
  const baseInterpolations = interpolationsFrom(base,   ignoreList);
  const addValIssue = type => key => issues.push({
    level: 'ERR',
    lang,
    key,
    err: `val:${type}`,
    detail:[
      '- en: '      + trFrom(base,   key),
      `- ${lang}: ` + trFrom(langTr, key),
    ],
  });
  onlyInFirst(baseInterpolations, thisInterpolations).forEach(addValIssue('missing'));
  onlyInFirst(thisInterpolations, baseInterpolations).forEach(addValIssue('extra'));
}

issues.sort((a, b) => {
  a = a.key.replace(/:.*/, '');
  b = b.key.replace(/:.*/, '');
  if(a === b) return 0;
  if(a > b) return 1;
  return -1;
});

log('');

log('# Issues found:');
log('');
issues.forEach(i => {
  log('  *', i.level.padEnd(4, ' '), i.err.padEnd(11, ' '), `${i.lang}:${i.key}`);
  if(i.detail) i.detail.forEach(d => log('   ', '>', d));
});
log('');

const errorCount = issues.filter(i => i.level === 'ERR' ).length;
const warnCount  = issues.filter(i => i.level === 'WARN').length;

log('# Summary');
log('');
log('  * Warnings:', warnCount);
log('  *   Errors:', errorCount);
log('');

if(errorCount) {
  log('FAILED');
  process.exit(1);
} else {
  log('Completed OK');
}

function load(lang) {
  const path = `${translationDir}/${lang}.json`;
  log('loading:', path, '...');
  return JSON.parse(readFileSync(path));
}

function keysFrom(obj) {
  const keys = [];
  const descend = (obj, prefix) => {
    for(const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? prefix + '.' + k : k;
      if(typeof v === 'object' && !Array.isArray(v)) descend(v, fullKey);
      else keys.push(fullKey);
    }
  };
  descend(obj);
  return keys;
}

function onlyInFirst(a, b) {
  return a.filter(v => !b.includes(v));
}

function interpolationsFrom(obj, ignoreKeys) {
  const interpolations = [];
  const descend = (obj, prefix) => {
    for(const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? prefix + '.' + k : k;
      if(ignoreKeys.includes(fullKey)) continue;
      if(typeof v === 'object' && !Array.isArray(v)) descend(v, fullKey);
      else {
        if(!v.includes('{')) continue;
        const match = v.match(/{.*?}/g);
        if(!match) continue;
        console.log(k, v, match);
        interpolations.push(
           ...match.map(v => fullKey + ':' + v.substr(1, v.length - 2))
        );
      }
    }
  };
  descend(obj);
  console.log('interpolations:', interpolations);
  return interpolations;
}

function trFrom(lang, key) {
  return key.replace(/:.*/, '').split('.').reduce((translations, k) => translations?.[k], lang);
}
