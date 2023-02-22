import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityTable from '../../../src/components/entity/table.vue';

import useProject from '../../../src/request-data/project';
import useEntities from '../../../src/request-data/entities';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (props = undefined) => {
  const container = createTestContainer({
    requestData: testRequestData([useProject, useEntities], {
      project: testData.extendedProjects.last(),
      odataEntities: {
        status: 200,
        data: testData.entityOData(),
        config: {
          url: '/v1/projects/1/datasets/trees/Entities'
        }
      }
    })
  });
  return mount(EntityTable, {
    props: {
      properties: testData.extendedDatasets.last().properties,
      ...props
    },
    container
  });
};

const headers = (table) => table.findAll('th').map(th => th.text());

describe('EntityTable', () => {
  describe('metadata headers', () => {
    it('renders the correct headers for a form', () => {
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(1);
      const component = mountComponent();
      const table = component.get('#entity-table-metadata');
      headers(table).should.eql(['', 'Created by', 'Created at']);
    });
  });

  describe('property headers', () => {
    it('shows a header for each property', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [{ name: 'p1' }, { name: 'p2' }]
      });
      testData.extendedEntities.createPast(1);

      const table = mountComponent().get('#entity-table-data');
      headers(table).should.eql(['p1', 'p2', 'Label', 'Entity ID']);
    });
  });

  it('renders the correct number of rows', () => {
    testData.extendedDatasets.createPast(1);
    testData.extendedEntities.createPast(2);
    const component = mountComponent();
    component.findAllComponents(EntityMetadataRow).length.should.equal(2);
    component.findAllComponents(EntityDataRow).length.should.equal(2);
  });

  it('passes the correct rowNumber prop to EntityMetadataRow', () => {
    // Create 3 entities and load all 3.
    testData.extendedDatasets.createPast(1);
    testData.extendedEntities.createPast(3);
    const component = mountComponent();
    const rows = component.findAllComponents(EntityMetadataRow);
    rows.map(row => row.props().rowNumber).should.eql([3, 2, 1]);
  });
});
