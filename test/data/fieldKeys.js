import R from 'ramda';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore, view } from './data-store';
import { validateDateOrder } from './validate';

export const extendedFieldKeys = dataStore({
  factory: () => ({
    displayName: faker.name.findName(),
    token: faker.random.arrayElement([faker.app.token(), null]),
    meta: null,
    lastUsed: faker.random.arrayElement([faker.date.past().toISOString(), null]),
    createdBy: R.pick(
      ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
      administrators.randomOrCreatePast()
    )
  }),
  validate: [
    validateDateOrder('createdBy.createdAt', 'createdAt'),
    validateDateOrder('createdAt', 'lastUsed')
  ],
  constraints: {
    withAccess: (fieldKey) => fieldKey.token != null,
    withAccessRevoked: (fieldKey) => fieldKey.token == null
  },
  sort: (fieldKey1, fieldKey2) => {
    const accessRevoked1 = fieldKey1.token == null;
    const accessRevoked2 = fieldKey2.token == null;
    if (accessRevoked1 !== accessRevoked2) {
      if (accessRevoked1) return 1;
      if (accessRevoked2) return -1;
    }
    if (fieldKey1.createdAt < fieldKey2.createdAt)
      return 1;
    else if (fieldKey1.createdAt > fieldKey2.createdAt)
      return -1;
    return 0;
  }
});

export const simpleFieldKeys = view(extendedFieldKeys, (extendedFieldKey) => {
  const fieldKey = R.omit(['lastUsed'], extendedFieldKey);
  fieldKey.createdBy = fieldKey.createdBy.id;
  return fieldKey;
});
