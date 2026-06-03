// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const fs = require('fs');

const { destructure, readSourceMessages, rekeyTranslations, writeTranslations } = require('../util/transifex');
const { logThenThrow, mapComponentsToFiles } = require('../util/util');

const filenamesByComponent = mapComponentsToFiles('src/components');
const { messages: sourceMessages, transifexPaths } = readSourceMessages(
  'src/locales',
  filenamesByComponent
);

try {
  for (const basename of fs.readdirSync('transifex')) {
    // Skip .DS_Store and other dot files.
    if (basename.startsWith('.')) continue; // eslint-disable-line no-continue
    const match = basename.match(/^strings_([-\w]+)\.json$/);
    if (match == null) logThenThrow(basename, 'invalid filename');
    const locale = match[1];
    console.log(`destructuring ${locale}`);

    const json = fs.readFileSync(`transifex/${basename}`).toString();
    const translated = destructure(json, locale);
    rekeyTranslations(sourceMessages, translated, transifexPaths);
    writeTranslations(
      locale,
      sourceMessages,
      translated,
      'src/locales',
      filenamesByComponent
    );
  }
  console.log('done');
} catch (err) {
  console.log(err);
  console.log();
  console.log('!!!');
  console.log('!!! Failed!  Have you pulled the latest JSON from Transifex?');
  console.log('!!!');
  console.log();
  process.exit(1);
}
