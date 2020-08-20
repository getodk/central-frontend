// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const fs = require('fs');

const { destructure, readSourceMessages, writeTranslations } = require('../util/transifex');
const { logThenThrow, mapComponentsToFiles } = require('../util/util');

const filenamesByComponent = mapComponentsToFiles('src/components');
const sourceMessages = readSourceMessages('src/locales', filenamesByComponent);
for (const basename of fs.readdirSync('transifex')) {
  // Skip .DS_Store and other dot files.
  if (basename.startsWith('.')) continue; // eslint-disable-line no-continue
  const match = basename.match(/^strings_([-\w]+)\.json$/);
  if (match == null) logThenThrow(basename, 'invalid filename');
  const locale = match[1];

  console.log(`destructuring ${locale}`); // eslint-disable-line no-console
  writeTranslations(
    locale,
    sourceMessages,
    destructure(fs.readFileSync(`transifex/${basename}`).toString(), locale),
    'src/locales',
    filenamesByComponent
  );
}
console.log('done'); // eslint-disable-line no-console
