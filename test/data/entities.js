import faker from 'faker';
import { comparator, omit } from 'ramda';

import { dataStore, view } from './data-store';
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
    ...options
  }) => {
    if (extendedDatasets.size === 0) {
      const properties = options.data != null
        ? Object.keys(options.data).map(name => ({ name, forms: [] }))
        : [];
      extendedDatasets.createPast(1, { properties, entities: 1 });
    }
    const dataset = options.dataset ?? extendedDatasets.first();
    const data = options.data ?? randomData(dataset.properties);
    const creator = options.creator ?? extendedUsers.first();
    const createdAt = !inPast
      ? new Date().toISOString()
      : fakePastDate([
        lastCreatedAt,
        creator.createdAt
      ]);
    return {
      uuid,
      currentVersion: { label, data, current: true },
      creatorId: creator.id,
      creator: toActor(creator),
      createdAt,
      updatedAt: null
    };
  },
  sort: comparator((entity1, entity2) =>
    isBefore(entity2.createdAt, entity1.createdAt))
});

export const standardEntities = view(extendedEntities, omit(['creator']));

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
        creatorId: entity.creator.id.toString(),
        creatorName: entity.creator.displayName,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }
    }))
});
