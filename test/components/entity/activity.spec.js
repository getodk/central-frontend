import EntityActivity from '../../../src/components/entity/activity.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(EntityActivity, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    container: {
      requestData: testRequestData([useEntity], {
        entity: testData.extendedEntities.last(),
        audits: testData.extendedAudits.sorted()
          .filter(({ action }) => action.startsWith('entity.')),
        entityVersions: testData.extendedEntityVersions.sorted()
      }),
      router: mockRouter('/projects/1/entity-lists/trees/entities/e')
    }
  }));
// Creates an entity with three versions, including a conflict, then resolves
// the conflict.
const resolveConflict = () => {
  testData.extendedEntities.createPast(1, { uuid: 'e' });
  testData.extendedAudits.createPast(1, {
    action: 'entity.create',
    details: {}
  });
  testData.extendedEntityVersions.createPast(1);
  testData.extendedAudits.createPast(1, {
    action: 'entity.update.version',
    details: {}
  });
  testData.extendedEntityVersions.createPast(1, { baseVersion: 1 });
  testData.extendedAudits.createPast(1, {
    action: 'entity.update.version',
    details: {}
  });
  testData.extendedEntities.resolve(-1);
  testData.extendedAudits.createPast(1, { action: 'entity.update.resolve' });
};

describe('EntityActivity', () => {
  describe('structure of the feed', () => {
    it('renders each entity event in its own group of feed entries', () => {
      resolveConflict();
      const component = mountComponent();
      component.findAll('.feed-entry-group').length.should.equal(4);
      component.findAll('.feed-entry-group .entity-feed-entry').length.should.equal(4);
    });

    it('renders 2 entries if entity was created on submission receipt', () => {
      const sourceDetails = testData.extendedEntities
        .createSourceSubmission('submission.create', { instanceId: 'some-uuid' });
      testData.extendedEntities.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: sourceDetails
      });
      const component = mountComponent();
      component.findAll('.feed-entry-group').length.should.equal(1);
      const entries = component.findAllComponents(EntityFeedEntry);
      entries.length.should.equal(2);
      entries[0].props().entry.action.should.equal('entity.create');
      entries[1].props().entry.action.should.equal('submission.create');
      entries[1].props().submission.instanceId.should.equal('some-uuid');
    });

    it('renders 3 entries if entity was created on submission approval', () => {
      const sourceDetails = testData.extendedEntities
        .createSourceSubmission('submission.update', { instanceId: 'some-uuid' });
      testData.extendedEntities.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: sourceDetails
      });
      const component = mountComponent();
      component.findAll('.feed-entry-group').length.should.equal(1);
      const entries = component.findAllComponents(EntityFeedEntry);
      entries.length.should.equal(3);
      entries[0].props().entry.action.should.equal('entity.create');
      entries[1].props().entry.action.should.equal('submission.update');
      entries[2].props().entry.action.should.equal('submission.create');
      entries[2].props().submission.instanceId.should.equal('some-uuid');
    });

    it('renders 2 entries if entity was created by a submission edit', () => {
      const sourceDetails = testData.extendedEntities
        .createSourceSubmission('submission.update.version', { instanceId: 'some-uuid' });
      testData.extendedEntities.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: sourceDetails
      });
      const component = mountComponent();
      component.findAll('.feed-entry-group').length.should.equal(1);
      const entries = component.findAllComponents(EntityFeedEntry);
      entries.length.should.equal(2);
      entries[0].props().entry.action.should.equal('entity.create');
      entries[1].props().entry.action.should.equal('submission.create');
      entries[1].props().submission.instanceId.should.equal('some-uuid');
    });
  });

  it('passes the correct entityVersion prop', () => {
    resolveConflict();
    mountComponent().findAllComponents(EntityFeedEntry)
      .map(entry => entry.props().entityVersion?.version)
      .should.eql([undefined, 3, 2, undefined]);
  });

  describe('scroll behavior', () => {
    beforeEach(resolveConflict);

    it('sets data-scroll-id attributes correctly', () => {
      mountComponent().findAll('.feed-entry-group')
        .map(group => group.attributes('data-scroll-id'))
        .should.eql([undefined, 'v3', 'v2', 'v1']);
    });

    it('adds scroll-target class if data-scroll-id matches route hash', () => {
      const component = mountComponent({
        container: {
          router: mockRouter('/projects/1/entity-lists/trees/entities/e#v2')
        }
      });
      component.findAll('.feed-entry-group')
        .map(group => group.classes('scroll-target'))
        .should.eql([false, false, true, false]);
    });
  });
});
