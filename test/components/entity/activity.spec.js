import EntityActivity from '../../../src/components/entity/activity.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(EntityActivity, {
  global: {
    provide: { projectId: '1', datasetName: 'trees' }
  },
  container: {
    requestData: testRequestData([useEntity], {
      project: testData.extendedProjects.last(),
      dataset: testData.extendedDatasets.last(),
      entity: testData.extendedEntities.last(),
      audits: testData.extendedAudits.sorted()
        .filter(({ action }) => action.startsWith('entity.')),
      diffs: []
    }),
    router: mockRouter('/projects/1/datasets/trees/entities/e')
  }
});

describe('EntityActivity', () => {
  describe('edit button', () => {
    it('renders the button for a sitewide administrator', () => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const button = mountComponent().find('#entity-activity-update-button');
      button.exists().should.be.true();
    });

    it('does not render the button for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      const button = mountComponent().find('#entity-activity-update-button');
      button.exists().should.be.false();
    });

    it('toggles the modal', () => {
      mockLogin();
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/datasets/trees/entities/e', { root: false })
        .testModalToggles({
          modal: EntityUpdate,
          show: '#entity-activity-update-button',
          hide: ['.btn-link']
        });
    });
  });

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
