const fs = require('fs');
const { comparator, last } = require('ramda');

const containsSubarray = (array, subarray) => {
  for (let i = 0; i < array.length - subarray.length + 1; i += 1) {
    if (subarray.every((element, j) => array[i + j] === element)) return true;
  }
  return false;
};

const logThenThrow = (toLog, errorMessage) => {
  console.error(toLog);
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



////////////////////////////////////////////////////////////////////////////////
// PROPERTY MANIPULATION

// Sets a nested property of an object, mutating the object.
const setPath = (path, value, obj) => {
  if (path.length === 0) throw new Error('empty path');
  let parent = obj;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (parent[path[i]] == null) parent[path[i]] = {};
    parent = parent[path[i]];
  }
  parent[last(path)] = value;
};

// Deletes a nested property of an object, mutating the object. All ancestor
// objects of the property that are empty after the deletion will also be
// deleted.
const deletePath = (path, obj) => {
  if (path.length === 0) return;
  const ancestors = [obj];
  for (let i = 0; i < path.length - 1; i += 1) {
    const ancestor = last(ancestors)[path[i]];
    if (ancestor == null) break;
    ancestors.push(ancestor);
  }
  if (ancestors.length === path.length) delete last(ancestors)[last(path)];
  for (let i = ancestors.length - 1; i > 0; i -= 1) {
    if (Object.keys(ancestors[i]).length === 0)
      delete (ancestors[i - 1])[path[i - 1]];
  }
};

// Orders the properties of an object alphabetically.
const sortProps = (obj) => {
  for (const name of Object.keys(obj).sort()) {
    const value = obj[name];
    delete obj[name]; // eslint-disable-line no-param-reassign
    obj[name] = value; // eslint-disable-line no-param-reassign
  }
};



////////////////////////////////////////////////////////////////////////////////
// EXPORT

module.exports = {
  containsSubarray, logThenThrow, mapComponentsToFiles,
  setPath, deletePath, sortProps
};
