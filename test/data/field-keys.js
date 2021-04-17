import faker from 'faker';
import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
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
    token = faker.random.alphaNumeric(64),
    lastUsed = undefined
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdBy = extendedUsers.first();
    const createdAt = inPast
      ? fakePastDate([lastCreatedAt, project.createdAt, createdBy.createdAt])
      : new Date().toISOString();
    return {
      id,
      projectId: project.id,
      type: 'field_key',
      displayName,
      token,
      lastUsed: lastUsed !== undefined
        ? lastUsed
        : (inPast && faker.random.boolean() ? fakePastDate([createdAt]) : null),
      createdBy: toActor(createdBy),
      createdAt,
      updatedAt: null
    };
  },
  sort: comparator((fieldKey1, fieldKey2) =>
    (fieldKey1.token != null && fieldKey2.token == null) ||
    isBefore(fieldKey2.createdAt, fieldKey1.createdAt))
});

export const standardFieldKeys = view(
  extendedFieldKeys,
  omit(['lastUsed', 'createdBy'])
);
