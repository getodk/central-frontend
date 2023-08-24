import EntityActivity from '../../../src/components/entity/activity.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(EntityActivity, {
  global: {
    provide: { projectId: '1', datasetName: 'trees' }
  },
  container: {
    requestData: testRequestData([useEntity], {
      entity: testData.extendedEntities.last(),
      audits: testData.extendedAudits.sorted()
        .filter(({ action }) => action.startsWith('entity.')),
      diffs: []
    }),
    router: mockRouter('/projects/1/entity-lists/trees/entities/e')
  }
});

describe('EntityActivity', () => {
  describe('feed', () => {
    it('renders 2 entries if entity was created on submission receipt', () => {
      const sourceDetails = testData.extendedEntities
        .createSourceSubmission('submission.create', { instanceId: 'some-uuid' });
      testData.extendedEntities.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: sourceDetails
      });
      const entries = mountComponent().findAllComponents(EntityFeedEntry);
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
      const entries = mountComponent().findAllComponents(EntityFeedEntry);
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
      const entries = mountComponent().findAllComponents(EntityFeedEntry);
      entries.length.should.equal(2);
      entries[0].props().entry.action.should.equal('entity.create');
      entries[1].props().entry.action.should.equal('submission.create');
      entries[1].props().submission.instanceId.should.equal('some-uuid');
    });
  });
});
