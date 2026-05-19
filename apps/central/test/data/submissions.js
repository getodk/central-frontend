import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { T, clone, comparator, hasPath, lensPath, path as getPath, set } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedForms } from './forms';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { fields } from './fields';
import { toActor } from './actors';
import { wktToGeojson } from '../util/data';

const fakeDateTime = () => {
  const date = faker.datatype.boolean() ? faker.date.past() : faker.date.future();
  return DateTime.fromJSDate(date);
};

// Returns a random OData value for a particular field of a submission.
const randomODataValue = (field, instanceId) => {
  switch (field.type) {
    case 'int':
      return faker.number.int(100);
    case 'decimal':
      return faker.number.float({ precision: 0.00001 });
    case 'string': {
      const { path } = field;
      if (path === '/meta/instanceID' || path === '/instanceID')
        return instanceId;
      const paragraphs = faker.number.int({ min: 1, max: 3 });
      return faker.lorem.paragraphs(paragraphs);
    }
    case 'date':
      return fakeDateTime().toFormat('yyyy-MM-dd');
    case 'time': {
      const formatted = fakeDateTime().toFormat('HH:mm:ss');
      return faker.datatype.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'dateTime': {
      const formatted = fakeDateTime().toISO({ includeOffset: false });
      return faker.datatype.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'geopoint':
      return 'POINT (0 90)';
    case 'binary':
      return faker.system.commonFileName('jpg');
    case null:
      return faker.datatype.boolean() ? 'y' : 'n';
    default:
      throw new Error('invalid field type');
  }
};

// Returns random OData for a submission. `partial` seeds the OData.
const randomOData = (instanceId, versionFields, partial) => versionFields
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
          field.type === 'structure' ? {} : randomODataValue(field, instanceId),
          data
        );
    },
    partial
  );

const odataToGeojson = (odata, versionFields) => {
  const field = versionFields.find(({ type }) => type === 'geopoint');
  if (field == null) return null;

  const path = field.path.split('/');
  path.shift();

  const geojson = wktToGeojson(getPath(path, odata));
  return geojson == null
    ? null
    : {
      ...geojson,
      id: odata.__id,
      properties: { fieldpath: field.path }
    };
};

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    attachmentsExpected = 0,
    // `form` is deprecated. Use formVersion instead.
    form = undefined,
    formVersion: formVersionOption = form,
    instanceId = faker.string.uuid(),

    submitter: submitterOption = undefined,
    attachmentsPresent = attachmentsExpected,
    status = null,
    reviewState = null,
    deviceId = null,
    edits = 0,
    deletedAt = null,

    ...partialOData
  }) => {
    const hasInstanceName = partialOData.meta != null &&
      typeof partialOData.meta === 'object' &&
      typeof partialOData.meta.instanceName === 'string';
    if (formVersionOption == null && extendedForms.size === 0) {
      const defaultFields = [];
      if (hasInstanceName)
        defaultFields.push(fields.group('/meta'), fields.string('/meta/instanceName'));
      defaultFields.push(attachmentsExpected === 0
        ? fields.string('/s')
        : fields.binary('/b'));

      // The lastSubmission property of the form will likely not match the
      // submission.
      extendedForms.createPast(1, { submissions: 1, fields: defaultFields });
    }
    const formVersion = formVersionOption ?? extendedForms.first();

    if (submitterOption == null && extendedUsers.size === 0)
      throw new Error('user not found');
    const submitter = submitterOption ?? extendedUsers.first();

    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        formVersion.publishedAt ?? formVersion.createdAt,
        submitter.createdAt
      ]);
    const odata = randomOData(instanceId, formVersion._fields, {
      ...partialOData,
      __id: instanceId,
      __system: {
        submissionDate: createdAt,
        updatedAt: null,
        deletedAt,
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
    });
    return {
      instanceId,
      deviceId,
      reviewState,
      submitterId: submitter.id,
      submitter: toActor(submitter),
      createdAt,
      updatedAt: null,
      deletedAt,
      currentVersion: {
        instanceId,
        instanceName: hasInstanceName ? odata.meta.instanceName : null,
        current: true,
        formVersion: formVersion.version,
        deviceId,
        submitterId: submitter.id,
        submitter: toActor(submitter),
        createdAt
      },
      // An actual submission JSON response does not have this property. We
      // include it here so that it is easy to match submission data and
      // metadata during testing.
      _odata: odata,
      _geojson: odataToGeojson(odata, formVersion._fields)
    };
  },
  sort: comparator((submission1, submission2) =>
    isBefore(submission2.createdAt, submission1.createdAt))
});

export const standardSubmissions = view(extendedSubmissions, (extended) => {
  const standard = clone(extended);
  delete standard.submitter;
  const { currentVersion } = standard;
  delete currentVersion.submitter;
  delete currentVersion.formVersion;
  return standard;
});

// Converts submission response objects to OData. Returns all data even for
// encrypted submissions.
const restToOData = (filterExpression) => (top = 250, skip = 0) => {
  const data = extendedSubmissions.sorted().filter(filterExpression);
  return {
    '@odata.count': data.length,
    value: data.slice(skip, skip + top)
      .map(submission => submission._odata)
  };
};

export const submissionOData = restToOData(submission => submission.deletedAt == null);

export const submissionDeletedOData = restToOData(submission => submission.deletedAt != null);

export const submissionGeojson = (filterExpression = T) => ({
  type: 'FeatureCollection',
  features: extendedSubmissions.sorted()
    .filter(filterExpression)
    .filter(submission => submission._geojson != null)
    .map(submission => submission._geojson)
});
