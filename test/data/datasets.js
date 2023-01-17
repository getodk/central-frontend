import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import { extendedProjects } from './projects';

// eslint-disable-next-line import/prefer-default-export
export const extendedDatasets = dataStore({
  factory: ({
    id,

    project = extendedProjects.size !== 0
      ? extendedProjects.first()
      : extendedProjects.createPast(1, { datasets: 1 }).last(),
    name = faker.internet.userName(),
    entities = faker.random.number({ min: 10, max: 50 }),
    lastEntity = new Date().toISOString().replace(/T.*/, '')
  }) => ({
    id,
    projectId: project.id,
    name,
    entities,
    lastEntity
  }),
  sort: comparator((dataset1, dataset2) => dataset1.name < dataset2.name)
});
