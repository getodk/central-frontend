import type { LocationQuery } from 'vue-router';

const DEFAULT_PARAMETERS_REGEX = /^d\[(.+)\]$/;

export const getDefaultParameters = (query: LocationQuery, actionType: string | undefined): Record<string, string> => {
  const result = {};
  if (actionType === 'edit') {
    // default parameters are ignored when editing an existing submission so don't waste time processing parameters
    return result;
  }
  Object.entries(query).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      const path = DEFAULT_PARAMETERS_REGEX.exec(key)?.[1];
      if (path) {
        result[path] = value;
      }
    }
  });
  return result;
};
