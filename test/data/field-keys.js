import faker from 'faker';
import { omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { fakePastDate } from '../util/date-time';
import { toActor } from './actors';

export const extendedFieldKeys = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    project = extendedProjects.size !== 0
      ? extendedProjects.first()
      : extendedProjects.createPast(1, { appUsers: 1 }).last(),
    displayName = faker.name.findName(),
    token = faker.random.alphaNumeric(64)
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdBy = extendedUsers.first();
    const createdAt = inPast
      ? fakePastDate([lastCreatedAt, project.createdAt, createdBy.createdAt])
      : new Date().toISOString();
    return {
      id,
      projectId: project.id,
      displayName,
      token,
      lastUsed: inPast && faker.random.boolean()
        ? fakePastDate([createdAt])
        : null,
      createdBy: toActor(createdBy),
      createdAt,
      updatedAt: null
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
