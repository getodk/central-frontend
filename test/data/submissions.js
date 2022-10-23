import faker from 'faker';
import { DateTime } from 'luxon';
import { comparator, hasPath, lensPath, omit, set } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedForms } from './forms';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { fields } from './fields';
import { toActor } from './actors';

const fakeDateTime = () => {
  const date = faker.random.boolean() ? faker.date.past() : faker.date.future();
  return DateTime.fromJSDate(date);
};

// Returns a random OData value for a particular field of a submission.
const odataValue = (field, instanceId) => {
  switch (field.type) {
    case 'int':
      return faker.random.number();
    case 'decimal':
      return faker.random.number({ precision: 0.00001 });
    case 'string': {
      const { path } = field;
      if (path === '/meta/instanceID' || path === '/instanceID')
        return instanceId;
      const paragraphs = faker.random.number({ min: 1, max: 3 });
      return faker.lorem.paragraphs(paragraphs);
    }
    case 'date':
      return fakeDateTime().toFormat('yyyy-MM-dd');
    case 'time': {
      const formatted = fakeDateTime().toFormat('HH:mm:ss');
      return faker.random.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'dateTime': {
      const formatted = fakeDateTime().toISO({ includeOffset: false });
      return faker.random.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'geopoint':
      return 'POINT (0 90)';
    case 'binary':
      return faker.system.commonFileName('jpg');
    case null:
      return faker.random.boolean() ? 'y' : 'n';
    default:
      throw new Error('invalid field type');
  }
};

// Returns random OData for a submission. `partial` seeds the OData.
const odata = (instanceId, versionFields, partial) => versionFields
  .reduce(
    (data, field) => {
      if (field.type === 'repeat') return data;
      const path = field.path.split('/');
      path.shift();
      // `partial` may have already specified a value for the field.
      return hasPath(path, data)
        ? data
        : set(
          lensPath(path),
          field.type === 'structure' ? {} : odataValue(field, instanceId),
          data
        );
    },
    partial
  );

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    attachmentsExpected = 0,
    // `form` is deprecated. Use formVersion instead.
    form = extendedForms.size !== 0
      ? extendedForms.first()
      // The lastSubmission property of the form will likely not match the
      // submission.
      : extendedForms
        .createPast(1, {
          submissions: 1,
          fields: attachmentsExpected !== 0
            ? [fields.binary('/b')]
            : undefined
        })
        .last(),
    formVersion = form,
    instanceId = faker.random.uuid(),

    submitter = extendedUsers.first(),
    attachmentsPresent = attachmentsExpected,
    status = null,
    reviewState = null,
    deviceId = null,
    edits = 0,

    ...partialOData
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        formVersion.publishedAt != null
          ? formVersion.publishedAt
          : formVersion.createdAt,
        submitter.createdAt
      ]);
    return {
      instanceId,
      deviceId,
      formVersion: formVersion.version,
      submitterId: submitter.id,
      submitter: toActor(submitter),
      createdAt,
      updatedAt: null,
      // An actual submission JSON response does not have this property. We
      // include it here so that it is easy to match submission data and
      // metadata during testing.
      _odata: odata(instanceId, formVersion._fields, {
        ...partialOData,
        __id: instanceId,
        __system: {
          submissionDate: createdAt,
          updatedAt: null,
          submitterId: submitter.id.toString(),
          submitterName: submitter.displayName,
          attachmentsPresent,
          attachmentsExpected,
          status,
          reviewState,
          deviceId,
          edits,
          formVersion: formVersion.version
        }
      })
    };
  },
  sort: comparator((submission1, submission2) =>
    isBefore(submission2.createdAt, submission1.createdAt))
});

export const standardSubmissions = view(
  extendedSubmissions,
  omit(['submitter'])
);

// Converts submission response objects to OData. Returns all data even for
// encrypted submissions.
export const submissionOData = (top = 250, skip = 0) => ({
  '@odata.count': extendedSubmissions.size,
  value: extendedSubmissions.sorted().slice(skip, skip + top)
    .map(submission => submission._odata)
});
