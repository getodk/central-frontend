const fs = require('fs');
const { comparator } = require('ramda');

const logThenThrow = (toLog, errorMessage) => {
  console.error(toLog); // eslint-disable-line no-console
  throw new Error(errorMessage);
};

const mapComponentsToFiles = (componentsDir) => {
  const sfcs = [];
  const dirs = [componentsDir];
  while (dirs.length !== 0) {
    const dir = dirs.pop();
    for (const basename of fs.readdirSync(dir)) {
      const path = `${dir}/${basename}`;
      if (fs.statSync(path).isDirectory()) {
        dirs.push(path);
      } else if (path.endsWith('.vue')) {
        const componentName = path
          .replace('src/components', '')
          .replace(/\.vue$/, '')
          .replace(/[-/](.)/g, (_, c) => c.toUpperCase());
        sfcs.push({ componentName, filename: path });
      }
    }
  }
  return sfcs
    .sort(comparator((sfc1, sfc2) => sfc1.componentName < sfc2.componentName))
    .reduce(
      (map, { componentName, filename }) => map.set(componentName, filename),
      new Map()
    );
};

module.exports = {
  logThenThrow,
  mapComponentsToFiles
};
