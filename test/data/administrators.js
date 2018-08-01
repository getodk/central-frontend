import faker from '../faker';
import { dataStore } from './data-store';
import { validateUniqueCombination } from './validate';

// eslint-disable-next-line import/prefer-default-export
export const administrators = dataStore({
  factory: () => ({
    displayName: faker.name.findName(),
    email: faker.internet.email(),
    meta: null
  }),
  validate: [
    validateUniqueCombination(['email'])
  ],
  sort: 'email'
});
