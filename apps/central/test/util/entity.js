import EntityList from '../../src/components/entity/list.vue';

import testData from '../data';
import { mergeMountOptions } from './lifecycle';
import { mockHttp } from './http';
import { mockRouter } from './router';
import { testRequestData } from './request-data';
import useEntities from '../../src/request-data/entities';

// eslint-disable-next-line import/prefer-default-export
export const loadEntityList = (mountOptions = {}) => {
  const project = testData.extendedProjects.last();
  const dataset = testData.extendedDatasets.last();
  const mergedOptions = mergeMountOptions(mountOptions, {
    props: {
      projectId: project.id.toString(),
      datasetName: dataset.name
    },
    container: {
      requestData: testRequestData([useEntities], {
        project,
        dataset
      }),
      router: mockRouter('')
    },
    global: {
      provide: { projectId: project.id.toString(), datasetName: dataset.name }
    }
  });
  const { deleted } = mergedOptions.props;
  return mockHttp()
    .mount(EntityList, mergedOptions)
    .respondWithData(() => testData.extendedFieldKeys.sorted())
    .respondWithData(() => (deleted ? testData.entityDeletedOData() : testData.entityOData()));
};
