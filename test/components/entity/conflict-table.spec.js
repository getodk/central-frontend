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

  describe('offline branch', () => {
    it('shows branches', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1, baseVersion: 1 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 })
        .createPast(1, { branchId: 'b2', trunkVersion: 4, branchBaseVersion: 4, baseVersion: 4 })
        .createPast(1, { branchId: 'b2', trunkVersion: 4, branchBaseVersion: 5 })
        .createPast(1, { branchId: 'b2', trunkVersion: 4, branchBaseVersion: 6 });
      const component = mountComponent();
      const td = component.findAll('#entity-conflict-table-branch-row td');
      td.length.should.equal(4);

      // v1
      td[0].text().should.equal('');
      should.not.exist(td[1].attributes().colspan);

      // v2
      td[1].text().should.equal('');
      should.not.exist(td[1].attributes().colspan);

      // b1
      td[2].text().should.equal('Offline update chain');
      td[2].attributes().colspan.should.equal('2');

      // b2
      td[3].text().should.equal('Offline update chain');
      td[3].attributes().colspan.should.equal('3');
    });

    it('does not show a branch made up of one update', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(2, { baseVersion: 1 }) // Cause a conflict.
        .createPast(1, { branchId: 'b1', trunkVersion: 3, branchBaseVersion: 4, baseVersion: 3 });
      const component = mountComponent();
      const { requestData } = component.vm.$container;
      should.exist(requestData.localResources.entityVersions[3].branch);
      const tr = component.find('#entity-conflict-table-branch-row');
      tr.exists().should.be.false;
    });

    it('does not show a branch that is not contiguous', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1, baseVersion: 1 })
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2, baseVersion: 3 });
      const tr = mountComponent().find('#entity-conflict-table-branch-row');
      tr.exists().should.be.false;
    });

    it('shows a branch that is contiguous, but not with trunk version', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1, baseVersion: 1 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 });
      const component = mountComponent();
      const td = component.findAll('#entity-conflict-table-branch-row td');
      td.length.should.equal(3);
      td[0].text().should.equal('');
      td[1].text().should.equal('');
      td[2].text().should.equal('Offline update chain');
      td[2].attributes().colspan.should.equal('2');
    });

    it('does not show a branch unless all its versions are shown', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2 })
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 3 })
        .createPast(1, { baseVersion: 2 })
        .createPast(1);
      const component = mountComponent();
      headers(component).should.eql(['v2', 'v4', 'v5', 'v6']);
      const tr = mountComponent().find('#entity-conflict-table-branch-row');
      // v2 and v4 are part of a contiguous branch, but because v3 is not shown,
      // the branch is not shown.
      tr.exists().should.be.false;
    });
  });
});
