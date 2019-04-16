import R from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';

export const extendedProjects = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    name = faker.name.findName(),
    // The default value of this property does not necessarily match
    // testData.extendedForms.
    forms = inPast ? faker.random.number() : 0,
    // The default value of this property does not necessarily match
    // testData.extendedFieldKeys.
    appUsers = inPast ? faker.random.number() : 0
  }) => {
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt
    ]);
    return {
      id,
      name,
      createdAt,
      updatedAt,
      // Extended metadata
      forms,
      // This property does not necessarily match testData.extendedSubmissions.
      lastSubmission: forms !== 0 && faker.random.boolean()
        ? faker.date.pastSince(createdAt).toISOString()
        : null,
      appUsers
    };
  },
  sort: (project1, project2) => project1.name.localeCompare(project2.name)
});

export const standardProjects = view(
  extendedProjects,
  R.omit(['forms', 'lastSubmission', 'appUsers'])
);
