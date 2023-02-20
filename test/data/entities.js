import faker from 'faker';
import { comparator, hasPath, lensPath, omit, set } from 'ramda';

import { dataStore, view } from './data-store';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';
import { extendedDatasets } from './datasets';

// Returns random OData for a submission. `partial` seeds the OData.
const odata = (entityId, properties, partial) => properties
  .reduce(
    (data, property) =>
      (hasPath([property.name], data)
        ? data
        : set(
          lensPath([property.name]),
          faker.random.word(),
          data
        )),
    partial
  );

// eslint-disable-next-line import/prefer-default-export
export const extendedEntities = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    dataset = extendedDatasets.size !== 0
      ? extendedDatasets.first()
      : extendedDatasets.createPast(1).last(),
    entityId = faker.random.uuid(),
    label = faker.random.word(),
    creator = extendedUsers.first(),

    ...partialOData
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        creator.createdAt
      ]);
    return {
      entityId,
      dataset,
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt,
      _odata: odata(entityId, dataset.properties, {
        ...partialOData,
        name: entityId,
        label,
        __id: entityId,
        __system: {
          createdAt,
          creatorId: creator.id.toString(),
          creatorName: creator.displayName
        }
      })
    };
  },
  sort: comparator((submission1, submission2) =>
    isBefore(submission2.createdAt, submission1.createdAt))
});

export const standardSubmissions = view(
  extendedEntities,
  omit(['creator'])
);

// Converts submission response objects to OData. Returns all data even for
// encrypted submissions.
export const entityOData = (top = 250, skip = 0) => ({
  '@odata.count': extendedEntities.size,
  value: extendedEntities.sorted().slice(skip, skip + top)
    .map(entity => entity._odata)
});
