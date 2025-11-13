const { readFileSync } = require('node:fs');

const { containsSubarray } = require('../util/util');

const structured = JSON.parse(readFileSync('transifex/strings_en.json').toString());

const pathsByString = new Map();
const addString = (s, path) => {
  if (!pathsByString.has(s)) pathsByString.set(s, []);
  pathsByString.get(s).push(path);
};
const groupStrings = (obj, parentPath = []) => {
  // Skip component interpolation.
  if (obj.full != null) return;

  for (const [key, value] of Object.entries(obj)) {
    const path = [...parentPath, key];
    if (value.string != null)
      addString(value.string, path);
    else
      groupStrings(value, path);
  }
};
groupStrings(structured);

// Sometimes it's possible to figure out the context of a string from its path.
// For example, a string with "title" in its path may need to be capitalized
// differently from other strings. If a string appears twice, but in two
// different contexts, we won't flag that as a duplicate. We don't want to flag
// too many false duplicates.
const contextPaths = [['title'], ['header'], ['audit', 'action'], []];
const isPossibleDuplicate = (paths) => {
  if (paths.length === 1) return false;
  const counts = new Array(contextPaths.length).fill(0);
  for (const path of paths) {
    const index = contextPaths.findIndex(contextPath =>
      containsSubarray(path, contextPath));
    counts[index] += 1;
  }
  return counts.some(count => count > 1);
};

const logDuplicate = (s, paths) => {
  console.log(JSON.stringify(s));
  console.log('Transifex keys:');
  for (const path of paths) console.log(`- ${path.join('.')}`);
  console.log();
};

console.log('Possible duplicates:\n');
for (const [s, paths] of pathsByString.entries()) {
  if (isPossibleDuplicate(paths)) logDuplicate(s, paths);
}
