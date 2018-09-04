import R from 'ramda';
import { DateTime } from 'luxon';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { sortByUpdatedAtOrCreatedAtDesc } from './sort';
import { validateUniqueCombination } from './validate';

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    instanceId = faker.random.uuid(),

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
    const submitter = administrators.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      submitter.createdAt
    ]);

    const oData = {
      ...partialOData,
      __id: instanceId,
      __system: {
        submissionDate: createdAt,
        submitterId: submitter.id.toString(),
        submitterName: submitter.displayName
      }
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
    if (oData.testDate == null && hasDate) {
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      oData.testDate = dateTime.toFormat('yyyy-MM-dd');
    }
    if (oData.testTime == null && hasTime) {
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      oData.testTime = dateTime.toFormat('HH:mm:ss');
      if (faker.random.boolean()) oData.testTime += '+01:00';
    }
    if (oData.testDateTime == null && hasDateTime) {
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      oData.testDateTime = dateTime.toISO({ includeOffset: false });
      if (faker.random.boolean()) oData.testDateTime += '+01:00';
    }
    if (oData.testGeopoint == null && hasGeopoint) {
      // [longitude, latitude], not [latitude, longitude]
      const coordinates = [
        faker.random.number({ min: -180, max: 180, precision: 0.0000000001 }),
        faker.random.number({ min: -85, max: 85, precision: 0.0000000001 })
      ];
      if (faker.random.boolean()) coordinates.push(faker.random.number());
      oData.testGeopoint = { type: 'Point', coordinates };
    }
    if (oData.testGroup == null) oData.testGroup = {};
    if (oData.testGroup.testBinary == null && hasBinary)
      oData.testGroup.testBinary = faker.system.commonFileName('jpg');
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
      id,
      formId: form.id,
      instanceId,
      // We currently do not use the XML anywhere. If/when we do, we should
      // consider whether to keep it in sync with the _oData property.
      xml: '',
      submitter: R.pick(
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt'],
        submitter
      ),
      _oData: oData,
      createdAt,
      updatedAt
    };
  },
  validate: [
    validateUniqueCombination(['formId', 'instanceId'])
  ],
  sort: sortByUpdatedAtOrCreatedAtDesc
});

export const submissionOData = () => {
  if (extendedSubmissions.size === 0) return {};
  return {
    value: extendedSubmissions.sorted().map(submission => submission._oData)
  };
};
