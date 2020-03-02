import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { toActor } from './actors';

export const extendedFieldKeys = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    project = extendedProjects.firstOrCreatePast(),
    displayName = faker.name.findName(),
    token = faker.random.alphaNumeric(64)
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdBy = extendedUsers.first();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      project.createdAt,
      createdBy.createdAt
    ]);
    return {
      id,
      projectId: project.id,
      displayName,
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

export const standardFieldKeys = view(extendedFieldKeys, (extendedFieldKey) => {
  const fieldKey = omit(['lastUsed'], extendedFieldKey);
  fieldKey.createdBy = fieldKey.createdBy.id;
  return fieldKey;
});
