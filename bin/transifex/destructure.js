// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const fs = require('fs');
const { hasPath, path } = require('ramda');

const { deletePath, logThenThrow, mapComponentsToFiles, setPath } = require('../util/util');
const { destructure, readSourceMessages, writeTranslations } = require('../util/transifex');

const filenamesByComponent = mapComponentsToFiles('src/components');
const { messages: sourceMessages, transifexPaths } = readSourceMessages(
  'src/locales',
  filenamesByComponent
);
for (const basename of fs.readdirSync('transifex')) {
  // Skip .DS_Store and other dot files.
  if (basename.startsWith('.')) continue; // eslint-disable-line no-continue
  const match = basename.match(/^strings_([-\w]+)\.json$/);
  if (match == null) logThenThrow(basename, 'invalid filename');
  const locale = match[1];
  console.log(`destructuring ${locale}`); // eslint-disable-line no-console

  const json = fs.readFileSync(`transifex/${basename}`).toString();
  const translated = destructure(json, locale);

  // Implement @transifexKey.
  for (const [sourcePath, transifexPath] of transifexPaths)
    setPath(sourcePath, path(transifexPath, translated), translated);
  for (const [, transifexPath] of transifexPaths) {
    if (!hasPath(transifexPath, sourceMessages))
      deletePath(transifexPath, translated);
  }

  writeTranslations(
    locale,
    sourceMessages,
    translated,
    'src/locales',
    filenamesByComponent
  );
}
console.log('done'); // eslint-disable-line no-console
