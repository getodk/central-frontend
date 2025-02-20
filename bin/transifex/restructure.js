// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const fs = require('fs');

const { mapComponentsToFiles } = require('../util/util');
const { readSourceMessages, rekeySource, restructure, sourceLocale } = require('../util/transifex');

const { messages, transifexPaths } = readSourceMessages(
  'src/locales',
  mapComponentsToFiles('src/components')
);
const structured = restructure(messages);
rekeySource(structured, transifexPaths);
fs.writeFileSync(
  `transifex/strings_${sourceLocale}.json`,
  JSON.stringify(structured, null, 2)
);
