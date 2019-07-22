import faker from '../faker';
import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const sessions = dataStore({
  factory: ({ inPast, lastCreatedAt }) => ({
    token: faker.central.token(),
    csrf: faker.central.token(),
    expiresAt: faker.date.future().toISOString(),
    createdAt: faker.date.timestamps(inPast, [lastCreatedAt]).createdAt
  })
});
