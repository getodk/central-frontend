import sinon from 'sinon';

import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityTable from '../../../src/components/entity/table.vue';

import useProject from '../../../src/request-data/project';
import useEntities from '../../../src/request-data/entities';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (props = undefined) => mount(EntityTable, {
  global: {
    provide: { projectId: '1', datasetName: 'trees' }
  },
  props: {
    properties: testData.extendedDatasets.last().properties,
    awaitingDeletedResponses: new Set(),
    ...props
  },
  container: {
    router: mockRouter('/projects/1/entity-lists/trees/entities'),
    requestData: testRequestData([useProject, useEntities], {
      project: testData.extendedProjects.last(),
      odataEntities: {
        status: 200,
        data: testData.entityOData(),
        config: { url: '/v1/projects/1/datasets/trees.svc/Entities' }
      }
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
      headers(table).should.eql([
        '',
        'Row',
        '',
        'Created by',
        'Created at',
        'Last update'
      ]);
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

  describe('row click', () => {
    it('opens the correct entity when clicking a specific row', async () => {
      testData.extendedDatasets.createPast(1);
      testData.extendedEntities.createPast(2);
      const entities = testData.extendedEntities.sorted();
      sinon.stub(window, 'open');
      const component = mountComponent();
      const rows = component.findAll('.table-freeze-frozen tbody tr');
      await rows[1].trigger('click');
      window.open.calledOnce.should.be.true;
      const [url, target] = window.open.firstCall.args;
      url.should.equal(`/projects/1/entity-lists/trees/entities/${entities[1].uuid}`);
      target.should.equal('_blank');
    });
  });
});
