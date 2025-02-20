import { comparator } from 'ramda';

import { dataStore } from './data-store';
import { extendedProjects } from './projects';

// Returns summary statistics about entities that try to be internally
// consistent. The stats will not necessarily match testData.extendedEntities or
// the project's lastEntity property.
const normalizeEntityStats = (stats) => {
  const result = { ...stats };
  if (result.entities == null) {
    result.entities = result.conflicts !== 0
      ? result.conflicts
      : (result.lastEntity != null ? 1 : 0);
  }
  if (result.lastEntity == null && result.entities !== 0)
    result.lastEntity = new Date().toISOString();
  return result;
};

const normalizeProperty = (property) => ({
  odataName: property.name,
  forms: [],
  ...property
});

// eslint-disable-next-line import/prefer-default-export
export const extendedDatasets = dataStore({
  factory: ({
    id,

    project: projectOption = extendedProjects.first(),
    name = 'trees',
    properties = [],
    approvalRequired = false,
    entities = undefined,
    lastEntity = undefined,
    conflicts = 0,
    linkedForms = [],
    sourceForms = []
  }) => {
    const entityStats = normalizeEntityStats({ entities, lastEntity, conflicts });
    const project = projectOption ?? extendedProjects
      .createPast(1, { datasets: 1, lastEntity: entityStats.lastEntity })
      .last();
    return {
      id,
      projectId: project.id,
      name,
      properties: properties.map(normalizeProperty),
      approvalRequired,
      ...entityStats,
      linkedForms,
      sourceForms
    };
  },
  sort: comparator((dataset1, dataset2) => dataset1.name < dataset2.name)
});

extendedDatasets.addProperty = (index, property) => {
  const properties = [...extendedDatasets.get(index).properties, normalizeProperty({ name: property })];
  extendedDatasets.update(index, { properties });
  return extendedDatasets.get(index);
};
