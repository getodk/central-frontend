import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import { extendedUsers } from './users';
import { fakePastDate, isBefore } from '../util/date-time';
import { toActor } from './actors';
import { extendedDatasets } from './datasets';

const randomData = (properties) => {
  const data = {};
  for (const { name } of properties) data[name] = faker.random.word();
  return data;
};

export const extendedEntities = dataStore({
  factory: ({
    inPast,
    lastCreatedAt,

    uuid = faker.random.uuid(),
    label = faker.random.word(),
    creator = extendedUsers.first(),
    ...options
  }) => {
    if (extendedUsers.size === 0) throw new Error('user not found');
    if (extendedDatasets.size === 0) {
      const properties = options.data != null
        ? Object.keys(options.data).map(name => ({ name, forms: [] }))
        : [];
      extendedDatasets.createPast(1, { properties, entities: 1 });
    }
    const dataset = options.dataset ?? extendedDatasets.first();
    const data = options.data ?? randomData(dataset.properties);
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        creator.createdAt
      ]);
    return {
      uuid,
      currentVersion: { label, data },
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt
    };
  },
  sort: comparator((entity1, entity2) =>
    isBefore(entity2.createdAt, entity1.createdAt))
});

// Converts entity response objects to OData.
export const entityOData = (top = 250, skip = 0) => ({
  '@odata.count': extendedEntities.size,
  value: extendedEntities.sorted().slice(skip, skip + top)
    .map(entity => ({
      ...entity.currentVersion.data,
      name: entity.uuid,
      label: entity.currentVersion.label,
      __id: entity.uuid,
      __system: {
        createdAt: entity.createdAt,
        creatorId: entity.creator.id.toString(),
        creatorName: entity.creator.displayName
      }
    }))
});
