import R from 'ramda';

export const validateDateOrder = (path1, path2) => (object) => {
  const date1 = R.path(path1.split('.'), object);
  if (date1 == null) return true;
  const date2 = R.path(path2.split('.'), object);
  return date2 == null || date1 <= date2;
};

export const validateUniqueCombination = (propertyNames) => (object, store) => {
  for (let i = 0; i < store.size; i += 1) {
    if (propertyNames.every(name => object[name] === store.get(i)[name]))
      return false;
  }
  return true;
};
