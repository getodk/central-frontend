import faker from 'faker';

import { dataStore } from './data-store';
import { fakePastDate } from '../util/date-time';

// eslint-disable-next-line import/prefer-default-export
export const sessions = dataStore({
  factory: ({ inPast, lastCreatedAt }) => ({
    token: faker.random.alphaNumeric(64),
    csrf: faker.random.alphaNumeric(64),
    expiresAt: faker.date.future().toISOString(),
    createdAt: inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString()
  })
});
