import R from 'ramda';
import { DateTime } from 'luxon';

import faker from '../faker';
import { administrators } from './administrators';
import { dataStore } from './data-store';
import { extendedForms } from './forms';
import { sortByUpdatedAtOrCreatedAtDesc } from './sort';
import { validateUniqueCombination } from './validate';

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
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      return dateTime.toFormat('yyyy-MM-dd');
    }
    case 'time': {
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      const formatted = dateTime.toFormat('HH:mm:ss');
      return faker.random.boolean() ? formatted : `${formatted}+01:00`;
    }
    case 'dateTime': {
      const dateTime = DateTime.fromJSDate(faker.date.pastOrFuture());
      const formatted = dateTime.toISO({ includeOffset: false });
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
    const fieldLens = R.lensPath(field.path);
    if (R.view(fieldLens, data) != null) {
      // `partial` has already specified a value for the field. Return without
      // overwriting the existing value.
      return data;
    }
    if (field.type == null)
      return R.set(fieldLens, faker.random.boolean() ? 'y' : 'n', data);
    if (exists[field.type])
      return R.set(fieldLens, oDataValue(field, instanceId), data);
    // exists[field.type] is not truthy, so we do not set a value for the field.
    // However, if the field is an element of a group, we ensure that the data
    // includes an object for the group -- even though that object may end up
    // being empty.
    if (field.path.length === 1) return data;
    const groupLens = R.lensPath(field.path.slice(0, field.path.length - 1));
    return R.view(groupLens, data) != null ? data : R.set(groupLens, {}, data);
  },
  partial
);

// eslint-disable-next-line import/prefer-default-export
export const extendedSubmissions = dataStore({
  factory: ({
    inPast,
    id,
    lastCreatedAt,

    instanceId = faker.random.uuid(),

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
    const form = extendedForms.randomOrCreatePast();
    const submitter = administrators.randomOrCreatePast();
    const { createdAt, updatedAt } = faker.date.timestamps(inPast, [
      lastCreatedAt,
      submitter.createdAt
    ]);
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
      createdAt,
      updatedAt,
      _oData: oData({
        form,
        instanceId,
        partial: {
          ...partialOData,
          __id: instanceId,
          __system: {
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
  validate: [
    validateUniqueCombination(['formId', 'instanceId'])
  ],
  sort: sortByUpdatedAtOrCreatedAtDesc
});

export const submissionOData = (top = 250, skip = 0) => {
  const result = { '@odata.count': extendedSubmissions.size };
  if (extendedSubmissions.size !== 0) {
    result.value = extendedSubmissions.sorted().slice(skip, skip + top)
      .map(submission => submission._oData);
  }
  return result;
};
