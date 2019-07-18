import { comparator } from 'ramda';

import faker from '../faker';
import { dataStore } from './data-store';

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
    get public() { throw new Error('not implemented'); },
    managed,
    hint,
    createdAt: faker.date.timestamps(inPast, [lastCreatedAt]).createdAt
  }),
  sort: comparator((key1, key2) => key1.id > key2.id)
});
