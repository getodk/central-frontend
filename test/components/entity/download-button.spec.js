import { nextTick } from 'vue';

import EntityDownloadButton from '../../../src/components/entity/download-button.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { relativeUrl } from '../../util/request';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(EntityDownloadButton, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    container: {
      requestData: testRequestData(['odataEntities'], {
        dataset: testData.extendedDatasets.last()
      })
    }
  }));

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

      it('shows correct text after first chunk of entities has loaded', async () => {
        testData.extendedDatasets.createPast(1, { entities: 2000 });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        const { odataEntities } = component.vm.$container.requestData.localResources;
        odataEntities.data = { count: 1000 };
        await nextTick();
        component.text().should.equal('Download 1,000 matching Entities');
      });
    });
  });

  describe('href attribute', () => {
    it('sets the correct attribute', () => {
      testData.extendedDatasets.createPast(1);
      const { href } = mountComponent().attributes();
      href.should.equal('/v1/projects/1/datasets/trees/entities.csv');
    });

    it('sets the correct attribute if entities are filtered', () => {
      testData.extendedDatasets.createPast(1);
      const component = mountComponent({
        props: { odataFilter: '__system/conflict ne null' }
      });
      const { href } = component.attributes();
      href.should.startWith('/v1/projects/1/datasets/trees/entities.csv?');
      const { searchParams } = relativeUrl(href);
      searchParams.get('$filter').should.equal('__system/conflict ne null');
    });
  });
});
