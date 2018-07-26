import R from 'ramda';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore, view } from './data-store';
import { sortByUpdatedAtOrCreatedAtDesc } from './sort';
import { validateDateOrder, validateUniqueCombination } from './validate';

export const extendedForms = dataStore({
  factory: ({ hasInstanceId = faker.random.boolean() }) => {
    const xmlFormId = `a${faker.random.alphaNumeric(8)}`;
    const name = faker.random.arrayElement([faker.name.findName(), null]);
    const anySubmission = faker.random.boolean();
    const version = faker.random.boolean() ? faker.random.number().toString() : '';
    const instanceId = [];
    if (hasInstanceId) {
      instanceId.push({
        path: faker.random.boolean() ? ['meta', 'instanceID'] : ['instanceID'],
        type: 'string'
      });
    }
    return {
      xmlFormId,
      name,
      version,
      state: faker.random.arrayElement(['open', 'closing', 'closed']),
      hash: faker.random.number({ max: (16 ** 32) - 1 }).toString(16).padStart('0'),
      // The following two properties do not necessarily match
      // testData.extendedSubmissions.
      submissions: anySubmission ? faker.random.number({ min: 1 }) : 0,
      lastSubmission: anySubmission ? faker.date.past().toISOString() : null,
      createdBy: R.pick(
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
        administrators.randomOrCreatePast()
      ),
      // We currently do not use the XML anywhere. If/when we do, we should
      // consider whether to keep it in sync with the hash and _schema
      // properties.
      xml: '',
      _schema: [
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
      ]
    };
  },
  validate: [
    validateUniqueCombination(['xmlFormId']),
    validateDateOrder('createdBy.createdAt', 'createdAt'),
    validateDateOrder('createdAt', 'lastSubmission')
  ],
  constraints: {
    withName: (form) => form.name != null,
    open: (form) => form.state === 'open',
    notOpen: (form) => form.state !== 'open',
    withSubmission: (form) => form.submissions !== 0,
    withoutSubmission: (form) => form.submissions === 0
  },
  sort: sortByUpdatedAtOrCreatedAtDesc
});

export const simpleForms = view(extendedForms, (extendedForm) => {
  const form = R.omit(['lastSubmission', 'submissions'], extendedForm);
  form.createdBy = form.createdBy.id;
  return form;
});
