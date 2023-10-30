import EntityDownloadButton from '../../../src/components/entity/download-button.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { relativeUrl } from '../../util/request';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) => {
  const dataset = testData.extendedDatasets.last();
  return mount(EntityDownloadButton, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: dataset.name }
    },
    container: { requestData: testRequestData(['odataEntities'], { dataset }) }
  }));
};

describe('EntityDownloadButton', () => {
  describe('text', () => {
    it('shows the correct text', () => {
      testData.extendedDatasets.createPast(1, { entities: 1000 });
      mountComponent().text().should.equal('Download 1,000 Entities');
    });

    describe('entities are filtered', () => {
      it('shows correct text while first chunk of entities is loading', () => {
        testData.extendedDatasets.createPast(1);
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        component.text().should.equal('Download matching Entities');
      });

      it('shows correct text after first chunk of entities has loaded', () => {
        testData.extendedDatasets.createPast(1, { entities: 2000 });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' },
          container: {
            requestData: {
              odataEntities: { count: 1000 }
            }
          }
        });
        component.text().should.equal('Download 1,000 matching Entities');
      });
    });
  });

  describe('href attribute', () => {
    it('sets the correct attribute', () => {
      testData.extendedDatasets.createPast(1, { name: 'á' });
      const { href } = mountComponent().attributes();
      href.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
    });

    it('sets the correct attribute if entities are filtered', () => {
      testData.extendedDatasets.createPast(1, { name: 'á' });
      const component = mountComponent({
        props: { odataFilter: '__system/conflict ne null' }
      });
      const { href } = component.attributes();
      href.should.startWith('/v1/projects/1/datasets/%C3%A1/entities.csv?');
      const { searchParams } = relativeUrl(href);
      searchParams.get('$filter').should.equal('__system/conflict ne null');
    });
  });
});
