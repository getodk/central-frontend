const fs = require('fs');

const { readSourceMessages, restructure, sourceLocale } = require('../util/transifex');
const { mapComponentsToFiles } = require('../util/util');

const messages = readSourceMessages(
  'src/locales',
  mapComponentsToFiles('src/components')
);
const structured = restructure(messages);
fs.writeFileSync(
  `transifex/strings_${sourceLocale}.json`,
  JSON.stringify(structured, null, 2)
);
