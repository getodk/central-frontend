import { dataStore, view } from './data-store';
import { fakePastDate } from '../util/date-time';

// A config does not have a createdAt or updatedAt property, but it does have a
// setAt property, which is similar in some ways. dataStore() implements logic
// around createdAt and updatedAt. Because of that, we first create a store of
// objects with createdAt and updatedAt properties, then create a view that sets
// setAt by combining createdAt and updatedAt.
const configs = dataStore({
  factory: ({ inPast, lastCreatedAt, key, value, setAt = undefined }) => ({
    key,
    value,
    createdAt: setAt != null
      ? setAt
      : (inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString()),
    updatedAt: null
  })
});

const transforms = {
  backups: ({ value, setAt }) => ({ ...value, setAt })
};

// eslint-disable-next-line import/prefer-default-export
export const standardConfigs = view(configs, (config) => {
  const { createdAt, updatedAt, ...withSetAt } = config;
  withSetAt.setAt = updatedAt != null ? updatedAt : createdAt;
  const transform = transforms[config.key];
  return transform != null ? transform(withSetAt) : withSetAt;
});

standardConfigs.forKey = (key) => {
  for (let i = 0; i < configs.size; i += 1) {
    if (configs.get(i).key === key) return standardConfigs.get(i);
  }
  return null;
};
