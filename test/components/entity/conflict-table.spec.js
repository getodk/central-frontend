import EntityConflictTable from '../../../src/components/entity/conflict-table.vue';

import useEntityVersions from '../../../src/request-data/entity-versions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) => {
  const container = createTestContainer({
    requestData: testRequestData([useEntityVersions], {
      dataset: testData.extendedDatasets.last(),
      entityVersions: testData.extendedEntityVersions.sorted()
    }),
    router: mockRouter('/')
  });
  return mount(EntityConflictTable, mergeMountOptions(options, {
    props: {
      uuid: testData.extendedEntities.last().uuid,
      versions: container.requestData.localResources.entityVersions
        .filter(version => version.relevantToConflict)
    },
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    container
  }));
};
// Returns the column headers. Excludes the first column header, which is static
// text.
const headers = (component) =>
  component.findAll('thead th:nth-child(n + 2)').map(th => th.text());
// Returns the table data for a row. Excludes the row header in the first
// column, which is often static text.
const rowData = (component, row) =>
  component.findAll(`tbody tr:nth-child(${row + 1}) td`).map(td => td.text());

describe('EntityConflictTable', () => {
  it('shows a column header for each version', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    headers(mountComponent()).should.eql(['v1', 'v2', 'v3']);
  });

  describe('base version', () => {
    it('shows the definition', async () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const dfn = mountComponent().get('.dfn');
      dfn.text().should.equal('Based on');
      await dfn.should.have.tooltip('The version of this Entity that the author saw when they made their changes');
    });

    it('shows the base version numbers', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(2)
        .createPast(1, { baseVersion: 2 });
      const component = mountComponent();
      headers(component).should.eql(['v2', 'v3', 'v4']);
      rowData(component, 0).should.eql(['v1', 'v2', 'v2']);
    });

    it('is empty for v1', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      const component = mountComponent();
      headers(component).should.eql(['v1', 'v2', 'v3']);
      rowData(component, 0).should.eql(['', 'v1', 'v1']);
    });
  });
});
