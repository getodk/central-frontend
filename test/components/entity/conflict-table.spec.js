import EntityConflictTable from '../../../src/components/entity/conflict-table.vue';

import useEntityVersions from '../../../src/request-data/entity-versions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const dataset = testData.extendedDatasets.last();
  const container = createTestContainer({
    requestData: testRequestData([useEntityVersions], {
      dataset,
      entityVersions: testData.extendedEntityVersions.sorted()
    }),
    router: mockRouter(`/projects/1/datasets/${encodeURIComponent(dataset.name)}/entities`)
  });
  return mount(EntityConflictTable, {
    props: {
      uuid: testData.extendedEntities.last().uuid,
      versions: container.requestData.entityVersions
        .filter(version => version.relevantToConflict)
    },
    container
  });
};
// Returns the column headers. Excludes the first column, which is static text.
const headers = (component) =>
  component.findAll('th:nth-child(n + 1)').map(th => th.text());
// Returns the table data for a row. Excludes the first column, which is static
// text.
const rowData = (component, row) =>
  component.findAll(`tbody tr:nth-child(${row + 1}) td:nth-child(n + 1)`)
    .map(td => td.text());

describe('EntityConflictTable', () => {
  beforeEach(mockLogin);

  it('shows a column for each version', () => {
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    testData.extendedEntityVersions.createPast(1, { baseVersion: 1 });
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
      testData.extendedEntityVersions.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 2 });
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
