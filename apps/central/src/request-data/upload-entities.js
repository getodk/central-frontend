import { odataEntityToRest } from '../util/odata';
import { useRequestData } from './index';

// useUploadEntities() creates serverEntities, which the EntityUpload modal uses
// to store existing entities that it retrieves from the server.

export default () => {
  const { dataset, createResource } = useRequestData();

  return createResource('serverEntities', () => ({
    transformResponse: ({ data }) => data.value.reduce(
      (map, entity) => map.set(
        entity.__id,
        odataEntityToRest(entity, dataset.properties).currentVersion
      ),
      new Map()
    )
  }));
};
