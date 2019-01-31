import R from 'ramda';

import faker from '../faker';
import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const administrators = dataStore({
  factory: ({ inPast, id, lastCreatedAt }) => ({
    id,
    displayName: faker.name.findName(),
    email: faker.internet.uniqueEmail(),
    ...faker.date.timestamps(inPast, [lastCreatedAt])
  }),
  sort: R.comparator((administrator1, administrator2) =>
    administrator1.email < administrator2.email)
});
