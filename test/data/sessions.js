import faker from '../faker';
import { dataStore } from './data-store';

// eslint-disable-next-line import/prefer-default-export
export const sessions = dataStore({
  id: false,
  updatedAt: false,
  factory: () => ({
    token: faker.app.token(),
    expiresAt: faker.date.future().toISOString()
  })
});
