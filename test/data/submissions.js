import faker from 'faker';
import { DateTime } from 'luxon';
import { comparator, lensPath, set, view } from 'ramda';

import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { extendedUsers } from './users';
import { fakePastDate } from '../util/date-time';
import { toActor } from './actors';

const fakeDateTime = () => {
  const date = faker.random.boolean() ? faker.date.past() : faker.date.future();
  return DateTime.fromJSDate(date);
};

// Returns a random OData value for a particular field of a submission.
const oDataValue = (field, instanceId) => {
  switch (field.type) {
    case 'int':
      return faker.random.number();
    case 'decimal':
      return faker.random.number({ precision: 0.00001 });
    case 'string': {
      const { path } = field;
      if ((path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
        (path.length === 1 && path[0] === 'instanceID'))
        return instanceId;
      const paragraphs = faker.random.number({ min: 1, max: 3 });
      return faker.lorem.paragraphs(paragraphs);
    }
    case 'date': {
      return fakeDateTime().toFormat('yyyy-MM-dd');
    }
    case 'time': {
      const formatted = fakeDateTime().toFormat('HH:mm:ss');
      return faker.random.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'dateTime': {
      const formatted = fakeDateTime().toISO({ includeOffset: false });
      return faker.random.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'geopoint': {
      // [longitude, latitude], not [latitude, longitude]
      const coordinates = [
        faker.random.number({ min: -180, max: 180, precision: 0.0000000001 }),
        faker.random.number({ min: -85, max: 85, precision: 0.0000000001 })
      ];
      if (faker.random.boolean()) coordinates.push(faker.random.number());
      return { type: 'Point', coordinates };
    }
    case 'binary':
      return faker.system.commonFileName('jpg');
    default:
      throw new Error('invalid field type');
  }
};

// Returns random OData for a form submission. `partial` seeds the OData.
// `exists` indicates for each field type whether a field of that type should
// have a value or should be empty. `partial` takes precedence over `exists`:
// see partialOData in extendedSubmissions.
const oData = ({ form, instanceId, partial, exists }) => form._schema.reduce(
  (data, field) => {
    // Once we resolve issue #82 for Backend, we should implement repeat groups.
    if (field.type === 'repeat') return data;
    const fieldLens = lensPath(field.path);
    if (view(fieldLens, data) != null) {
      // `partial` has already specified a value for the field. Return without
      // overwriting the existing value.
      return data;
    }
    if (field.type == null)
      return set(fieldLens, faker.random.boolean() ? 'y' : 'n', data);
    if (exists[field.type])
      return set(fieldLens, oDataValue(field, instanceId), data);
    // exists[field.type] is not truthy, so we do not set a value for the field.
    // However, if the field is an element of a group, we ensure that the data
    // includes an object for the group -- even though that object may end up
    // being empty.
    if (field.path.length === 1) return data;
    const groupLens = lensPath(field.path.slice(0, field.path.length - 1));
    return view(groupLens, data) != null ? data : set(groupLens, {}, data);
  },
  partial
);

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    form = extendedForms.first(),
    instanceId = faker.random.uuid(),
    status = null,

    hasInt = faker.random.boolean(),
    hasDecimal = faker.random.boolean(),
    // We should probably rename this to hasString at some point for
    // consistency.
    hasStrings = faker.random.boolean(),
    hasDate = faker.random.boolean(),
    hasTime = faker.random.boolean(),
    hasDateTime = faker.random.boolean(),
    hasGeopoint = faker.random.boolean(),
    hasBinary = faker.random.boolean(),

    // partialOData takes precedence over the has* parameters. For example, if
    // partialOData specifies a value for an int field, then even if hasInt is
    // false, the int field will have the specified value.
    ...partialOData
  }) => {
    if (form === undefined) throw new Error('form not found');
    if (extendedUsers.size === 0) throw new Error('user not found');
    const submitter = extendedUsers.first();
    const createdAt = inPast
      ? fakePastDate([lastCreatedAt, submitter.createdAt])
      : new Date().toISOString();
    return {
      instanceId,
      submitter: toActor(submitter),
      createdAt,
      updatedAt: null,
      _oData: oData({
        form,
        instanceId,
        partial: {
          ...partialOData,
          __id: instanceId,
          __system: {
            status,
            submissionDate: createdAt,
            submitterId: submitter.id.toString(),
            submitterName: submitter.displayName
          }
        },
        exists: {
          int: hasInt,
          decimal: hasDecimal,
          string: hasStrings,
          date: hasDate,
          time: hasTime,
          dateTime: hasDateTime,
          geopoint: hasGeopoint,
          binary: hasBinary
        }
      })
    };
  },
  sort: comparator((submission1, submission2) =>
    submission1.createdAt > submission2.createdAt)
});

// Converts submission response objects to OData. Returns all data even for
// encrypted submissions.
export const submissionOData = (top = 250, skip = 0) => ({
  '@odata.count': extendedSubmissions.size,
  value: extendedSubmissions.sorted().slice(skip, skip + top)
    .map(submission => submission._oData)
});
