// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const { mapComponentsToFiles } = require('../util/util');
const { readSourceMessages, rekeySource, restructure } = require('../util/transifex');

const { messages, transifexPaths } = readSourceMessages(
  'apps/central/src/locales',
  mapComponentsToFiles('apps/central/src/components')
);
const structured = restructure(messages);
rekeySource(structured, transifexPaths);

// eslint-disable-next-line no-console
console.log(JSON.stringify(structured, null, 2));
