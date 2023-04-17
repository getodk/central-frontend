// For a description of our Transifex workflow and how this script fits into it,
// see CONTRIBUTING.md.

const fs = require('fs');
const { hasPath, path } = require('ramda');

const { deletePath, mapComponentsToFiles, setPath, sortProps } = require('../util/util');
const { readSourceMessages, restructure, sourceLocale } = require('../util/transifex');

// Convert Vue I18n messages to Transifex Structured JSON.
const { messages, transifexPaths } = readSourceMessages(
  'src/locales',
  mapComponentsToFiles('src/components')
);
const structured = restructure(messages);

// Implement @transifexPath.
for (const [vuePath, transifexPath] of transifexPaths) {
  if (!hasPath(transifexPath, structured))
    setPath(transifexPath, path(vuePath, structured), structured);
  deletePath(vuePath, structured);
}
// Re-alphabeticalize components by name in order to minimize the diff.
sortProps(structured.component);

fs.writeFileSync(
  `transifex/strings_${sourceLocale}.json`,
  JSON.stringify(structured, null, 2)
);
