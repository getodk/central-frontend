import { last } from 'ramda';

import EntityDiffRow from '../../../../src/components/entity/diff/row.vue';
import EntityDiffTable from '../../../../src/components/entity/diff/table.vue';
import EntityVersionLink from '../../../../src/components/entity/version-link.vue';

import useEntity from '../../../../src/request-data/entity';

import createTestContainer from '../../../util/container';
import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { mockRouter } from '../../../util/router';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options = undefined) => {
  const { uuid } = testData.extendedEntities.last();
  const container = createTestContainer({
    requestData: testRequestData([useEntity], {
      entityVersions: testData.extendedEntityVersions.sorted()
    }),
    router: mockRouter(`/projects/1/entity-lists/trees/entities/${uuid}`)
  });
  const entityVersion = last(container.requestData.localResources.entityVersions);
  return mount(EntityDiffTable, {
    props: { diff: entityVersion[options?.props?.diff ?? 'baseDiff'] },
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
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(1);
      mountComponent().find('.conflicting').exists().should.be.false();
    });

    it('shows the old version number', () => {
      createConflict();
      const table = mountComponent();
      const td = table.get('td:nth-child(2)');
      td.text().should.equal('v1 (Update by Alice)');
      td.getComponent(EntityVersionLink).props().version.version.should.equal(1);
    });

    it('shows the correct version number for the server diff', () => {
      createConflict();
      const table = mountComponent({
        props: { diff: 'serverDiff' }
      });
      table.get('td:nth-child(2)').text().should.equal('v2 (Update by Bob)');
    });

    it('shows the new version number', () => {
      createConflict();
      const table = mountComponent();
      const td = table.get('td:last-child');
      td.text().should.equal('v3 (Update by David)');
      td.getComponent(EntityVersionLink).props().version.version.should.equal(3);
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
    const table = mountComponent();
    const props = table.getComponent(EntityDiffRow).props();
    props.oldVersion.version.should.equal(1);
    props.name.should.equal('label');
  });
});
