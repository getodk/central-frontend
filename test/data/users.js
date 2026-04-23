import { faker } from '@faker-js/faker';
import { omit } from 'ramda';

import { dataStore, view } from './data-store';
import { fakePastDate } from '../util/date-time';
import { standardRoles } from './roles';

const verbsByRole = (system) => {
  if (system === 'none') return [];
  const role = standardRoles.sorted().find(r => r.system === system);
  if (role == null) throw new Error('role not found');
  return role.verbs;
};

export const extendedUsers = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    displayName = faker.person.fullName(),
    email = `${faker.string.uuid()}@getodk.org`,
    // Sitewide role
    role = 'admin',
    verbs = verbsByRole(role),
    createdAt = undefined,
    deletedAt = undefined,
    preferences = undefined,
    lastLoginAt = undefined
  }) => ({
    id,
    type: 'user',
    displayName,
    email,
    verbs,
    createdAt: createdAt != null
      ? createdAt
      : (inPast ? fakePastDate([lastCreatedAt]) : new Date().toISOString()),
    updatedAt: null,
    deletedAt,
    lastLoginAt,
    preferences: {
      site: preferences?.site ?? {},
      projects: preferences?.projects ?? {}
    }
  }),
  sort: (administrator1, administrator2) =>
    administrator1.email.localeCompare(administrator2.email)
});

export const standardUsers = view(
  extendedUsers,
  omit(['verbs', 'preferences'])
);
