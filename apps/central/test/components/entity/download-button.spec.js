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
      mountComponent().find('.btn-primary').text().should.equal('Download');
    });

    describe('entities are filtered', () => {
      it('show the dropdown menu when odataFilter is set', () => {
        testData.extendedDatasets.createPast(1);
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        component.find('.btn-primary').attributes()['data-toggle'].should.be.eql('dropdown');
      });

      it('show the dropdown menu when searchTerm is set', () => {
        testData.extendedDatasets.createPast(1);
        const component = mountComponent({
          props: { searchTerm: 'lorem ipsum' }
        });
        component.find('.btn-primary').attributes()['data-toggle'].should.be.eql('dropdown');
      });

      it('show the dropdown menu when both odataFilter and searchTerm are set', () => {
        testData.extendedDatasets.createPast(1);
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null', searchTerm: 'lorem ipsum' }
        });
        component.find('.btn-primary').attributes()['data-toggle'].should.be.eql('dropdown');
      });

      it('shows correct text while first chunk of entities is loading for the first button', () => {
        testData.extendedDatasets.createPast(1);
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        component.find('li:nth-of-type(1)').text().should.equal('Download all matching Entities');
      });

      it('shows correct text after first chunk of entities has loaded for the first button', () => {
        testData.extendedDatasets.createPast(1, { entities: 2000 });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' },
          container: {
            requestData: {
              odataEntities: { count: 1000 }
            }
          }
        });
        component.find('li:nth-of-type(1)').text().should.equal('Download 1,000 matching Entities');
      });

      it('shows correct text for the second button', () => {
        testData.extendedDatasets.createPast(1, { entities: 2000 });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        component.find('li:nth-of-type(2)').text().should.equal('Download all 2,000 Entities');
      });
    });
  });

  describe('href attribute', () => {
    it('sets the correct attribute', () => {
      testData.extendedDatasets.createPast(1, { name: 'á' });
      const { href } = mountComponent().find('.btn-primary').attributes();
      const url = relativeUrl(href);
      url.pathname.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
      expect(url.searchParams.get('$filter')).to.be.null;
    });

    describe('entities are filtered', () => {
      it('sets the correct attribute for downloading filtered entities with odataFilter', () => {
        testData.extendedDatasets.createPast(1, { name: 'á' });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        const { href } = component.find('li:nth-of-type(1) a').attributes();
        const url = relativeUrl(href);
        url.pathname.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
        url.searchParams.get('$filter').should.equal('__system/conflict ne null');
      });

      it('sets the correct attribute for downloading filtered entities with searchTerm', () => {
        testData.extendedDatasets.createPast(1, { name: 'á' });
        const component = mountComponent({
          props: { searchTerm: 'lorem ipsum' }
        });
        const { href } = component.find('li:nth-of-type(1) a').attributes();
        const url = relativeUrl(href);
        url.pathname.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
        url.searchParams.get('$search').should.equal('lorem ipsum');
      });

      it('sets the correct attribute for downloading filtered entities with both odataFilter and searchTerm', () => {
        testData.extendedDatasets.createPast(1, { name: 'á' });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null', searchTerm: 'lorem ipsum' }
        });
        const { href } = component.find('li:nth-of-type(1) a').attributes();
        const url = relativeUrl(href);
        url.pathname.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
        url.searchParams.get('$filter').should.equal('__system/conflict ne null');
        url.searchParams.get('$search').should.equal('lorem ipsum');
      });

      it('sets the correct attribute for downloading all entities', () => {
        testData.extendedDatasets.createPast(1, { name: 'á' });
        const component = mountComponent({
          props: { odataFilter: '__system/conflict ne null' }
        });
        const { href } = component.find('li:nth-of-type(2) a').attributes();
        const url = relativeUrl(href);
        url.pathname.should.equal('/v1/projects/1/datasets/%C3%A1/entities.csv');
        expect(url.searchParams.get('$filter')).to.be.null;
      });
    });
  });

  describe('disabled (on deleted entity page)', () => {
    it('disables the button', async () => {
      testData.extendedDatasets.createPast(1, { entities: 2000 });
      const component = mountComponent({
        props: { disabled: true }
      });
      const button = component.find('.btn-primary');
      button.classes().should.include('disabled');
    });
  });
});
