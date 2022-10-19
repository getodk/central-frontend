import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import { fakePastDate } from '../util/date-time';

// eslint-disable-next-line import/prefer-default-export
export const standardKeys = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    managed = faker.random.boolean(),
    hint = managed && faker.random.boolean() ? 'helpful hint' : null
  }) => ({
    id,
    public: 'mybase64key',
    managed,
    hint,
    createdAt: inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString()
  }),
  sort: comparator((key1, key2) => key1.id > key2.id)
});
