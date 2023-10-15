import EntityDownloadButton from '../../../src/components/entity/download-button.vue';

import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(EntityDownloadButton, {
  global: {
    provide: { projectId: '1', datasetName: 'trees' }
  },
  container: {
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});

describe('EntityDownloadButton', () => {
  it('shows the correct text', () => {
    testData.extendedDatasets.createPast(1, { entities: 1000 });
    mountComponent().text().should.equal('Download 1,000 Entities');
  });

  it('sets the correct href attribute', () => {
    testData.extendedDatasets.createPast(1);
    const { href } = mountComponent().attributes();
    href.should.equal('/v1/projects/1/datasets/trees/entities.csv');
  });
});
