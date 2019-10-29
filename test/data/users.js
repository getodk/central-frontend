import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';
import { standardRoles } from './roles';

const verbsByRole = (system) => {
  if (system === 'none') return ['project.list'];
  const role = standardRoles.sorted().find(r => r.system === system);
  if (role == null) throw new Error('role not found');
  return role.verbs;
};

export const extendedUsers = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    displayName = faker.name.findName(),
    email = faker.internet.uniqueEmail(),
    role = 'admin',
    verbs = verbsByRole(role)
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
