import R from 'ramda';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore, view } from './data-store';
import { sortByUpdatedAtOrCreatedAtDesc } from './sort';

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

    xmlFormId = faker.central.xmlFormId(),
    hasName = faker.random.boolean(),
    isOpen = !inPast || faker.random.boolean(),

    hasInstanceId = faker.random.boolean(),
    schema = defaultSchema(hasInstanceId),

    ...options
  }) => {
    if (options.submissions != null) {
      if (!inPast && options.submissions !== 0)
        throw new Error('inPast and submissions are inconsistent');
      if (options.hasSubmission != null &&
        (options.submissions !== 0) !== options.hasSubmission)
        throw new Error('submissions and hasSubmission are inconsistent');
    } else {
      if (!inPast && options.hasSubmission === true)
        throw new Error('inPast and hasSubmission are inconsistent');
      const hasSubmission = options.hasSubmission != null
        ? options.hasSubmission
        : inPast && faker.random.boolean();
      // eslint-disable-next-line no-param-reassign
      options.submissions = hasSubmission ? faker.random.number({ min: 1 }) : 0;
    }
    const { submissions } = options;
    const name = hasName ? faker.name.findName() : null;
    const version = faker.random.boolean() ? faker.random.number().toString() : '';
    const createdBy = administrators.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      createdBy.createdAt
    ]);
    return {
      xmlFormId,
      name,
      version,
      state: isOpen ? 'open' : faker.random.arrayElement(['closing', 'closed']),
      hash: faker.random.hash(32),
      // The following two properties do not necessarily match
      // testData.extendedSubmissions.
      submissions,
      lastSubmission: submissions !== 0
        ? faker.date.pastSince(createdAt).toISOString()
        : null,
      createdBy: R.pick(
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
        createdBy
      ),
      // We currently do not use the XML anywhere. If/when we do, we should
      // consider whether to keep it in sync with the hash and _schema
      // properties.
      xml: '',
      createdAt,
      updatedAt,
      _schema: schema
    };
  },
  sort: sortByUpdatedAtOrCreatedAtDesc
});

export const simpleForms = view(extendedForms, (extendedForm) => {
  const form = R.omit(['lastSubmission', 'submissions'], extendedForm);
  form.createdBy = form.createdBy.id;
  return form;
});
