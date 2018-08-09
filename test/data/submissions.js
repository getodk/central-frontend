import R from 'ramda';
import { DateTime } from 'luxon';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { sortByUpdatedAtOrCreatedAtDesc } from './sort';
import { validateDateOrder, validateUniqueCombination } from './validate';

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    createdAt,

    hasInt = faker.random.boolean(),
    hasDecimal = faker.random.boolean(),
    hasStrings = faker.random.boolean(),
    hasDate = faker.random.boolean(),
    hasTime = faker.random.boolean(),
    hasDateTime = faker.random.boolean(),
    hasGeopoint = faker.random.boolean(),
    hasBinary = faker.random.boolean(),

    ...partialOData
  }) => {
    const form = extendedForms.randomOrCreatePast();
    const instanceId = faker.random.uuid();
    const submitter = administrators.randomOrCreatePast();

    const oData = {
      ...partialOData,
      __id: instanceId,
      __system: {
        submissionDate: createdAt,
        submitterId: submitter.id.toString(),
        submitterName: submitter.displayName
      }
    };
    const pastDateTime = (formatString) => {
      const dateTime = DateTime.fromJSDate(faker.date.past());
      const formatted = dateTime.toFormat(formatString);
      if (faker.random.boolean()) return formatted;
      return `${formatted}+0100`;
    };
    const schemaInstanceId = form._schema.find(question => {
      const { path } = question;
      return (path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
        (path.length === 1 && path[0] === 'instanceID');
    });
    if (schemaInstanceId != null) {
      if (schemaInstanceId.length === 1) {
        if (oData.instanceID == null) oData.instanceID = instanceId;
      } else {
        if (oData.meta == null) oData.meta = {};
        if (oData.meta.instanceID == null) oData.meta.instanceID = instanceId;
      }
    }
    if (oData.testInt == null && hasInt)
      oData.testInt = faker.random.number();
    if (oData.testDecimal == null && hasDecimal)
      oData.testDecimal = faker.random.number({ precision: 0.00001 });
    if (oData.testDate == null && hasDate)
      oData.testDate = pastDateTime('yyyy-MM-dd');
    if (oData.testTime == null && hasTime)
      oData.testTime = pastDateTime('HH:mm:ss');
    if (oData.testDateTime == null && hasDateTime)
      oData.testDateTime = pastDateTime('yyyy-MM-dd HH:mm:ss');
    if (oData.testGeopoint == null && hasGeopoint) {
      const coordinates = [
        faker.random.number({ min: -85, max: 85, precision: 0.0000000001 }),
        faker.random.number({ min: -180, max: 180, precision: 0.0000000001 })
      ];
      if (faker.random.boolean()) coordinates.push(faker.random.number());
      oData.testGeopoint = { type: 'Point', coordinates };
    }
    if (oData.testGroup == null) oData.testGroup = {};
    if (oData.testGroup.testBinary == null && hasBinary)
      oData.testGroup.testBinary = faker.system.commonFileName('.jpg');
    oData['testGroup-testBinary'] = 'a.jpg';
    oData.testBranch = faker.random.boolean() ? 'y' : 'n';
    if (hasStrings) {
      for (let i = 1; i <= 2; i += 1) {
        const name = `testString${i}`;
        if (oData[name] == null) {
          const count = faker.random.number({ min: 1, max: 3 });
          oData[name] = faker.lorem.paragraphs(count);
        }
      }
    }
    // Once we resolve issue #82 for Backend, we should add a repeat group to
    // the data.

    return {
      formId: form.id,
      instanceId,
      // We currently do not use the XML anywhere. If/when we do, we should
      // consider whether to keep it in sync with the _oData property.
      xml: '',
      submitter: R.pick(
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
        submitter
      ),
      _oData: oData
    };
  },
  validate: [
    validateUniqueCombination(['formId', 'instanceId']),
    validateDateOrder('submitter.createdAt', 'createdAt')
  ],
  sort: sortByUpdatedAtOrCreatedAtDesc
});

export const submissionOData = () => {
  if (extendedSubmissions.size === 0) return {};
  return {
    value: extendedSubmissions.sorted().map(submission => submission._oData)
  };
};
