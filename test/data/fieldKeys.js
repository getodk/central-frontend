import R from 'ramda';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore, view } from './data-store';

export const extendedFieldKeys = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    token = !inPast || faker.random.boolean() ? faker.central.token() : null
  }) => {
    const createdBy = administrators.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      createdBy.createdAt
    ]);
    return {
      id,
      displayName: faker.name.findName(),
      token,
      meta: null,
      lastUsed: inPast && faker.random.boolean()
        ? faker.date.pastSince(createdAt).toISOString()
        : null,
      createdBy: R.pick(
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
        createdBy
      ),
      createdAt,
      updatedAt
    };
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
