import { last } from 'ramda';

import EntityDiff from '../../../src/components/entity/diff.vue';
import EntityDiffHead from '../../../src/components/entity/diff/head.vue';
import EntityDiffTable from '../../../src/components/entity/diff/table.vue';

import useEntityVersions from '../../../src/request-data/entity-versions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => {
  const { uuid } = testData.extendedEntities.last();
  const container = createTestContainer({
    requestData: testRequestData([useEntityVersions], {
      entityVersions: testData.extendedEntityVersions.sorted()
    }),
    router: mockRouter(`/projects/1/entity-lists/trees/entities/${uuid}`)
  });
  const entityVersion = last(container.requestData.localResources.entityVersions);
  return mount(EntityDiff, {
    global: {
      provide: { projectId: '1', datasetName: 'trees', uuid, entityVersion }
    },
    container
  });
};

describe('EntityDiff', () => {
  describe('conflict class', () => {
    it('has the correct class if the version is a hard conflict', () => {
      testData.extendedEntities.createPast(1, { label: 'foo' });
      testData.extendedEntityVersions.createPast(1, { label: 'bar' });
      testData.extendedEntityVersions.createPast(1, {
        baseVersion: 1,
        label: 'baz',
        conflictingProperties: ['label']
      });
      mountComponent().classes('hard-conflict').should.be.true;
    });

    it('has the correct class if the version is a soft conflict', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      mountComponent().classes('soft-conflict').should.be.true;
    });

    it('has the correct class if the version is not a conflict', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(1);
      mountComponent().classes().should.eql(['entity-diff']);
    });
  });

  it('renders EntityDiffHead if the version is a conflict', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    mountComponent().findComponent(EntityDiffHead).exists().should.be.true;
  });

  it('passes the correct diff to EntityDiffTable', async () => {
    testData.extendedEntities.createPast(1, {
      label: 'dogwood',
      data: { height: '1' }
    });
    testData.extendedEntityVersions.createPast(1, { label: 'Dogwood' });
    testData.extendedEntityVersions.createPast(1, {
      baseVersion: 1,
      label: 'Dogwood',
      data: { height: '2' }
    });
    const component = mountComponent();
    const table = component.getComponent(EntityDiffTable);
    // Base diff
    Array.from(table.props().diff).should.eql(['label', 'height']);
    await component.get('.entity-diff-head li:nth-child(2) a').trigger('click');
    // Server diff
    Array.from(table.props().diff).should.eql(['height']);
  });

  it('does not render the table if there is no change or conflict', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(1);
    mountComponent().findComponent(EntityDiffTable).exists().should.be.false;
  });

  it('shows a message for an empty diff if the version is a conflict', () => {
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    mountComponent().get('.empty-table-message').should.be.visible();
  });
});
