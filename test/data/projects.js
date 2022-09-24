import faker from 'faker';
import { omit } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedUsers } from './users';
import { fakePastDate } from '../util/date-time';
import { standardRoles } from './roles';

const verbsForUserAndRole = (extendedUser, roleSystem) => {
  const verbs = new Set(extendedUser.verbs);

  if (roleSystem !== 'none') {
    const role = standardRoles.sorted().find(r => r.system === roleSystem);
    if (role == null) throw new Error('role not found');
    for (const verb of role.verbs)
      verbs.add(verb);
  }

  return Array.from(verbs);
};

export const extendedProjects = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    name = faker.name.findName(),
    description = '',
    archived = false,
    // The default value of this property does not necessarily match
    // testData.extendedDatasets.
    datasets = 0,
    // The default value of this property does not necessarily match
    // testData.extendedForms.
    forms = datasets === 0 ? 0 : 1,
    // The default value of this property does not necessarily match
    // testData.extendedFieldKeys.
    appUsers = 0,
    // The default value of this property does not necessarily match
    // testData.extendedForms or testData.extendedSubmissions.
    lastSubmission = null,
    key = null,
    currentUser = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last(),
    // The current user's role on the project
    role = 'none',
    formList = []
  }) => ({
    id,
    name,
    description,
    archived,
    keyId: key != null ? key.id : null,
    createdAt: inPast
      ? fakePastDate([lastCreatedAt])
      : new Date().toISOString(),
    updatedAt: null,
    // Extended metadata
    forms,
    lastSubmission,
    datasets,
    appUsers,
    verbs: verbsForUserAndRole(currentUser, role),
    formList
  }),
  sort: (project1, project2) => project1.name.localeCompare(project2.name)
});

export const standardProjects = view(
  extendedProjects,
  omit(['forms', 'lastSubmission', 'datasets', 'appUsers', 'verbs', 'formList'])
);
