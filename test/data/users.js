import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';

const verbsByRole = {
  admin: [
    'assignment.create',
    'assignment.list',
    'assignment.delete',
    'config.read',
    'project.create',
    'project.list',
    'user.create',
    'user.list',
    'user.read',
    'user.update',
    'user.delete',
    'user.password.invalidate'
  ],
  none: ['project.list']
};

export const extendedUsers = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    displayName = faker.name.findName(),
    email = faker.internet.uniqueEmail(),
    role = 'admin',
    verbs = verbsByRole[role]
  }) => ({
    id,
    displayName,
    email,
    verbs,
    ...faker.date.timestamps(inPast, [lastCreatedAt])
  }),
  sort: (administrator1, administrator2) =>
    administrator1.email.localeCompare(administrator2.email)
});

export const standardUsers = view(extendedUsers, omit(['verbs']));

// Deprecated.
export const administrators = standardUsers;
