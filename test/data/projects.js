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

// Returns extended metadata that tries to be internally consistent. The
// extended metadata will not necessarily match other test data stores.
const normalizeMetadata = (metadata) => {
  const result = { ...metadata };

  if (result.datasets == null) {
    result.datasets = result.datasetList != null
      ? result.datasetList.length
      : (result.lastEntity != null ? 1 : 0);
  }
  if (result.datasetList == null) result.datasetList = [];

  if (result.forms == null) {
    result.forms = result.formList != null
      ? result.formList.length
      : (result.lastSubmission != null || result.datasets !== 0 ? 1 : 0);
  }
  if (result.formList == null) result.formList = [];

  return result;
};

export const extendedProjects = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    name = faker.name.findName(),
    description = '',
    archived = false,
    key = null,
    // The default value of this property does not necessarily match
    // testData.extendedFieldKeys.
    appUsers = 0,
    forms = undefined,
    // The default value of this property does not necessarily match
    // testData.extendedForms or testData.extendedSubmissions.
    lastSubmission = null,
    datasets = undefined,
    // The default value of this property does not necessarily match
    // testData.extendedDatasets or testData.extendedEntities.
    lastEntity = null,
    formList = undefined,
    datasetList = undefined,
    currentUser = extendedUsers.size !== 0
      ? extendedUsers.first()
      : extendedUsers.createPast(1).last(),
    // The current user's role on the project
    role = 'none'
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
    ...normalizeMetadata({
      appUsers,
      forms,
      lastSubmission,
      datasets,
      lastEntity,
      formList,
      datasetList,
      verbs: verbsForUserAndRole(currentUser, role)
    })
  }),
  sort: (project1, project2) => project1.name.localeCompare(project2.name)
});

export const standardProjects = view(
  extendedProjects,
  omit(['appUsers', 'forms', 'lastSubmission', 'datasets', 'lastEntity', 'formList', 'datasetList', 'verbs'])
);
