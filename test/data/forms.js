import { omit } from 'ramda';

import faker from '../faker';
import { dataStore, view } from './data-store';
import { extendedProjects } from './projects';
import { extendedUsers } from './users';
import { toActor } from './actors';

const defaultSchema = (hasInstanceId) => {
  const instanceId = [];
  if (hasInstanceId) {
    instanceId.push({
      path: faker.random.boolean() ? ['meta', 'instanceID'] : ['instanceID'],
      type: 'string'
    });
  }
  return [
    ...instanceId,
    { path: ['testInt'], type: 'int' },
    { path: ['testDecimal'], type: 'decimal' },
    { path: ['testDate'], type: 'date' },
    { path: ['testTime'], type: 'time' },
    { path: ['testDateTime'], type: 'dateTime' },
    { path: ['testGeopoint'], type: 'geopoint' },
    { path: ['testGroup', 'testBinary'], type: 'binary' },
    // The column header for this question will be the same as the
    // previous question's.
    { path: ['testGroup-testBinary'], type: 'binary' },
    { path: ['testBranch'] },
    { path: ['testString1'], type: 'string' },
    { path: ['testString2'], type: 'string' },
    {
      path: ['testRepeat'],
      type: 'repeat',
      children: [
        { path: ['testString3'], type: 'string' }
      ]
    }
  ];
};

export const extendedForms = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    project = extendedProjects.firstOrCreatePast(),
    xmlFormId = faker.central.xmlFormId(),
    name = faker.random.boolean() ? faker.name.findName() : null,
    version = faker.random.boolean() ? faker.random.number().toString() : '',
    key = null,
    state = !inPast
      ? 'open'
      : faker.random.arrayElement(['open', 'closing', 'closed']),
    submissions = !inPast || faker.random.boolean()
      ? 0
      : faker.random.number({ min: 1 }),

    hasInstanceId = faker.random.boolean(),
    schema = defaultSchema(hasInstanceId)
  }) => {
    const createdBy = extendedUsers.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      createdBy.createdAt
    ]);
    return {
      projectId: project.id,
      xmlFormId,
      name,
      version,
      hash: faker.random.hash(32),
      keyId: key != null ? key.id : project.keyId,
      state,
      // The following two properties do not necessarily match
      // testData.extendedSubmissions.
      submissions,
      lastSubmission: submissions !== 0
        ? faker.date.pastSince(createdAt).toISOString()
        : null,
      createdBy: toActor(createdBy),
      createdAt,
      updatedAt,
      _schema: schema
    };
  },
  sort: (form1, form2) => {
    const nameOrId1 = form1.name != null ? form1.name : form1.xmlFormId;
    const nameOrId2 = form2.name != null ? form2.name : form2.xmlFormId;
    return nameOrId1.localeCompare(nameOrId2);
  }
});

export const standardForms = view(
  extendedForms,
  omit(['submissions', 'lastSubmission', 'createdBy'])
);

export const createProjectAndFormWithoutSubmissions = (options) => {
  const project = extendedProjects
    .createPast(1, { forms: 1, lastSubmission: null, ...options.project })
    .last();
  const form = extendedForms
    .createPast(1, { submissions: 0, ...options.form })
    .last();
  return { project, form };
};
