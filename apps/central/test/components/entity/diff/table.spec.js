import { markRaw } from 'vue';

import EntityDiffRow from '../../../../src/components/entity/diff/row.vue';
import EntityDiffTable from '../../../../src/components/entity/diff/table.vue';
import EntityVersionLink from '../../../../src/components/entity/version-link.vue';

import useEntityVersions from '../../../../src/request-data/entity-versions';

import createTestContainer from '../../../util/container';
import testData from '../../../data';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options = undefined) => {
  const { uuid } = testData.extendedEntities.last();
  const container = createTestContainer({
    requestData: testRequestData([useEntityVersions], {
      entityVersions: testData.extendedEntityVersions.sorted()
    }),
    router: mockRouter(`/projects/1/entity-lists/trees/entities/${uuid}`)
  });
  const { requestData } = container;
  const versionIndex = options?.global?.provide?.entityVersion ??
    testData.extendedEntityVersions.size - 1;
  const entityVersion = requestData.localResources.entityVersions[versionIndex];
  return mount(EntityDiffTable, {
    // Prevent Vue Test Utils from making the value of the `diff` prop reactive.
    props: { diff: markRaw(entityVersion[options?.props?.diff ?? 'baseDiff']) },
    global: {
      provide: { projectId: '1', datasetName: 'trees', uuid, entityVersion }
    },
    container
  });
};

describe('EntityDiffTable', () => {
  describe('Comparing row', () => {
    const createConflict = () => {
      const users = testData.extendedUsers
        .createPast(1, { displayName: 'Alice', email: 'alice@getodk.org' })
        .createPast(1, { displayName: 'Bob', email: 'bob@getodk.org' })
        .createPast(1, { displayName: 'David', email: 'david@getodk.org' })
        .sorted();
      testData.extendedEntities.createPast(1, { creator: users[0] });
      testData.extendedEntityVersions
        .createPast(1, { creator: users[1] })
        .createPast(1, { baseVersion: 1, creator: users[2] });
    };

    it('does not show the row if the version is not a conflict', () => {
      testData.extendedEntities.createPast(1, { label: 'dogwood' });
      testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
      mountComponent().find('.comparing').exists().should.be.false;
    });

    it('shows the old version number and source', () => {
      createConflict();
      const table = mountComponent();
      const wrapper = table.get('td:nth-child(2) .version-and-source');
      wrapper.text().should.equal('v1 (Update by Alice)');
      wrapper.getComponent(EntityVersionLink).props().version.version.should.equal(1);
    });

    it('shows the correct version number for the server diff', () => {
      createConflict();
      const table = mountComponent({
        props: { diff: 'serverDiff' }
      });
      table.get('td:nth-child(2)').text().should.equal('v2 (Update by Bob)');
    });

    it('shows the new version number and source', () => {
      createConflict();
      const table = mountComponent();
      const wrapper = table.get('td:last-child .version-and-source');
      wrapper.text().should.equal('v3 (Update by David)');
      wrapper.getComponent(EntityVersionLink).props().version.version.should.equal(3);
    });

    it('indicates if the new version was an offline update', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1 })
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2, baseVersion: 2 });
      const table = mountComponent();
      table.find('.comparing .offline-update').exists().should.be.true;
    });
  });

  describe('accuracy warning', () => {
    beforeEach(() => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 1, baseVersion: 1 })
        .createPast(1)
        .createPast(1, { branchId: 'b1', trunkVersion: 1, branchBaseVersion: 2, baseVersion: 3 });
    });

    it('shows a warning if baseDiff may be inaccurate', () => {
      mountComponent().find('.accuracy-warning').exists().should.be.true;
    });

    it('does not show a warning for first update in branch even if it is not contiguous with trunk version', () => {
      const table = mountComponent({
        global: {
          provide: { entityVersion: 2 }
        }
      });
      table.find('.accuracy-warning').exists().should.be.false;
    });
  });

  it('renders an EntityDiffRow for each change', () => {
    testData.extendedEntities.createPast(1, {
      label: 'dogwood',
      data: { height: '1', circumference: '2' }
    });
    testData.extendedEntityVersions.createPast(1, {
      label: 'Dogwood',
      data: { height: '3', circumference: '4' }
    });
    const table = mountComponent();
    table.findAllComponents(EntityDiffRow).length.should.equal(3);
  });

  it('passes the correct props to EntityDiffRow', () => {
    testData.extendedEntities.createPast(1, { label: 'dogwood' });
    testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
    const props = mountComponent().getComponent(EntityDiffRow).props();
    props.oldVersion.version.should.equal(1);
    props.name.should.equal('label');
  });
});
