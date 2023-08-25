import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityTable from '../../../src/components/entity/table.vue';

import useProject from '../../../src/request-data/project';
import useEntities from '../../../src/request-data/entities';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (props = undefined) => mount(EntityTable, {
  global: {
    provide: { projectId: '1', datasetName: 'trees' }
  },
  props: {
    properties: testData.extendedDatasets.last().properties,
    ...props
  },
  container: {
    router: mockRouter('/projects/1/entity-lists/trees/entities'),
    requestData: testRequestData([useProject, useEntities], {
      project: testData.extendedProjects.last(),
      odataEntities: testData.entityOData()
    })
  }
});

const headers = (table) => table.findAll('th').map(th => th.text());

describe('EntityTable', () => {
  describe('metadata headers', () => {
    it('renders the correct headers', () => {
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(1);
      const component = mountComponent();
      const table = component.get('.table-freeze-frozen');
      headers(table).should.eql(['', 'Created by', 'Created at', 'Last Updated / Actions']);
    });
  });

  describe('property headers', () => {
    it('shows a header for each property', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees',
        properties: [{ name: 'p1' }, { name: 'p2' }]
      });
      testData.extendedEntities.createPast(1);

      const table = mountComponent().get('.table-freeze-scrolling');
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

  describe('visibility of edit buttons', () => {
    it('renders the button for a sitewide administrator', () => {
      mockLogin();
      testData.extendedEntities.createPast(1);
      const row = mountComponent().getComponent(EntityMetadataRow);
      row.props().canUpdate.should.be.true();
      row.find('.update-button').exists().should.be.true();
    });

    it('does not render the button for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1);
      const row = mountComponent().getComponent(EntityMetadataRow);
      row.props().canUpdate.should.be.false();
      row.find('.update-button').exists().should.be.false();
    });
  });
});
