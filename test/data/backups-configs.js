import { omit } from 'ramda';

import { dataStore, view } from './data-store';
import { fakePastDate } from '../util/date-time';

const backupsConfigsWithCreatedAt = dataStore({
  factory: ({ inPast, lastCreatedAt, setAt = undefined }) => {
    const config = {
      type: 'google',
      setAt: setAt != null
        ? setAt
        : (inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString())
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
