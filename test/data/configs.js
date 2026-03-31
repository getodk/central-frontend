import { dataStore, view } from './data-store';
import { fakePastDate } from '../util/date-time';

// A config does not have a createdAt or updatedAt property, but it does have a
// setAt property, which is similar in some ways. dataStore() implements logic
// around createdAt and updatedAt. Because of that, we first create a store of
// objects with createdAt and updatedAt properties, then create a view that sets
// setAt by combining createdAt and updatedAt.
const configs = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    key,
    value = undefined,
    blobExists = undefined,
    setAt = undefined
  }) => {
    const config = {
      key,
      createdAt: setAt != null
        ? setAt
        : (inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString()),
      updatedAt: null
    };

    if (value !== undefined)
      config.value = value;
    else if (blobExists === true)
      config.blobExists = true;
    else
      throw new Error('config must have either a value or a blob');

    return config;
  }
});

// eslint-disable-next-line import/prefer-default-export
export const standardConfigs = view(configs, (config) => {
  const { createdAt, updatedAt, ...withSetAt } = config;
  withSetAt.setAt = updatedAt != null ? updatedAt : createdAt;
  return withSetAt;
});

standardConfigs.byKey = () => {
  const result = Object.create(null);
  for (const config of standardConfigs) result[config.key] = config;
  return result;
};

standardConfigs.forKey = (key) =>
  standardConfigs.find(config => config.key === key);
