import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';
import { extendedUsers } from './users';
import { toActor } from './actors';

export const extendedFieldKeys = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    token = !inPast || faker.random.boolean() ? faker.central.token() : null
  }) => {
    const createdBy = extendedUsers.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      createdBy.createdAt
    ]);
    return {
      id,
      displayName: faker.name.findName(),
      token,
      lastUsed: inPast && faker.random.boolean()
        ? faker.date.pastSince(createdAt).toISOString()
        : null,
      createdBy: toActor(createdBy),
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
    if (fieldKey1.createdAt < fieldKey2.createdAt) return 1;
    if (fieldKey1.createdAt > fieldKey2.createdAt) return -1;
    return 0;
  }
});

export const simpleFieldKeys = view(extendedFieldKeys, (extendedFieldKey) => {
  const fieldKey = omit(['lastUsed'], extendedFieldKey);
  fieldKey.createdBy = fieldKey.createdBy.id;
  return fieldKey;
});
