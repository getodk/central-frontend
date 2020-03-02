import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';

const backupsConfigsWithCreatedAt = dataStore({
  factory: ({ inPast, lastCreatedAt, setAt = undefined }) => {
    const config = {
      type: 'google',
      setAt: setAt != null
        ? setAt
        : faker.date.timestamps(inPast, [lastCreatedAt])
    };
    config.createdAt = config.setAt;
    return config;
  }
});

// eslint-disable-next-line import/prefer-default-export
export const standardBackupsConfigs = view(
  backupsConfigsWithCreatedAt,
  omit(['createdAt'])
);
