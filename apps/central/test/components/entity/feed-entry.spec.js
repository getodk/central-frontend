import { RouterLinkStub } from '@vue/test-utils';
import { last } from 'ramda';

import ActorLink from '../../../src/components/actor-link.vue';
import DatasetLink from '../../../src/components/dataset/link.vue';
import EntityDiff from '../../../src/components/entity/diff.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';
import FeedEntry from '../../../src/components/feed-entry.vue';
import SubmissionLink from '../../../src/components/submission/link.vue';
import SubmissionReviewState from '../../../src/components/submission/review-state.vue';

import useEntity from '../../../src/request-data/entity';
import useEntityVersions from '../../../src/request-data/entity-versions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';
import { textWithout } from '../../util/dom';

const mountComponent = (options = undefined) => {
  const entity = testData.extendedEntities.last();
  const container = createTestContainer({
    router: mockRouter(`/projects/1/entity-lists/trees/entities/${entity.uuid}`),
    requestData: testRequestData([useEntity, useEntityVersions], {
      entity,
      entityVersions: testData.extendedEntityVersions.sorted()
    })
  });
  const entry = testData.extendedAudits.last();
  const { action } = entry;
  const { entityVersions } = container.requestData.localResources;
  const entityVersion = action === 'entity.create' || action === 'entity.bulk.create'
    ? entityVersions[0]
    : (entityVersions.length > 1 ? last(entityVersions) : undefined);
  return mount(EntityFeedEntry, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees', uuid: entity.uuid }
    },
    props: { entry, entityVersion },
    container
  }));
};

describe('EntityFeedEntry', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
    testData.extendedEntities.createPast(1, {
      label: 'dogwood',
      data: { height: '1', circumference: '2' }
    });
  });

  describe('submission.create audit event', () => {
    const createSubmission = ({ deleted = false, ...options } = {}) => {
      // create a submission
      const fullSubmission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's', ...options })
        .last();
      // return either full or partial submission info depending on if submission was deleted
      const submission = (deleted)
        ? { instanceId: fullSubmission.instanceId, submitter: fullSubmission.submitter, createdAt: fullSubmission.createdAt }
        : { ...fullSubmission, xmlFormId: 'f' }; // full submission augmented with form id

      const audit = testData.extendedAudits
        .createPast(1, {
          action: 'submission.create',
          details: { instanceId: submission.instanceId }
        })
        .last();

      return {
        entry: audit,
        submission
      };
    };

    it('shows the correct icon', () => {
      const component = mountComponent({ props: createSubmission() });
      const icon = component.find('.feed-entry-title .icon-cloud-upload');
      icon.exists().should.be.true;
    });

    describe('submission still exists', () => {
      it('shows the instance name if the submission has one', () => {
        const component = mountComponent({
          props: createSubmission({
            meta: { instanceName: 'Some Name' }
          })
        });
        const text = component.get('.feed-entry-title').text();
        text.should.equal('Submission Some Name uploaded by Alice');
      });

      it('falls back to showing the instance ID', () => {
        const component = mountComponent({ props: createSubmission() });
        const text = component.get('.feed-entry-title').text();
        text.should.equal('Submission s uploaded by Alice');
      });

      it('links to the submission', () => {
        const component = mountComponent({
          props: createSubmission({
            meta: { instanceName: 'Some Name' }
          })
        });
        const title = component.get('.feed-entry-title');
        const link = title.getComponent(SubmissionLink);
        link.props().should.include({ projectId: '1', xmlFormId: 'f' });
        const { submission } = link.props();
        submission.instanceId.should.equal('s');
        submission.currentVersion.instanceName.should.equal('Some Name');
      });

      it('links to the submitter', () => {
        const component = mountComponent({ props: createSubmission() });
        const title = component.get('.feed-entry-title');
        const actorLink = title.getComponent(ActorLink);
        actorLink.props().actor.displayName.should.equal('Alice');
      });
    });

    describe('submission was deleted', () => {
      it('shows the correct text', () => {
        const component = mountComponent({
          props: createSubmission({ deleted: true })
        });
        const text = component.get('.feed-entry-title').text();
        text.should.equal('(deleted Submission s) uploaded by Alice');
      });

      it('links to the submitter', () => {
        const component = mountComponent({
          props: createSubmission({ deleted: true })
        });
        const title = component.get('.feed-entry-title');
        const actorLink = title.getComponent(ActorLink);
        actorLink.props().actor.displayName.should.equal('Alice');
      });

      it('does not link to the submission', () => {
        const component = mountComponent({
          props: createSubmission({ deleted: true })
        });
        component.findComponent(SubmissionLink).exists().should.be.false;
      });
    });
  });

  describe('submission.update audit event', () => {
    beforeEach(() => {
      testData.extendedAudits.createPast(1, { action: 'submission.update' });
    });

    it('shows the correct icon', () => {
      const title = mountComponent().get('.feed-entry-title');
      const { value } = title.getComponent(SubmissionReviewState).props();
      value.should.equal('approved');
    });

    it('shows the correct text', () => {
      const text = mountComponent().get('.feed-entry-title').text();
      text.should.equal('Approved by Alice');
    });

    it('links to the user', () => {
      const title = mountComponent().get('.feed-entry-title');
      const actorLink = title.getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('Alice');
    });
  });

  describe('entity.create audit event', () => {
    // The actual entity is created above. This function creates the
    // entity.create event.
    const createEntity = (options = {}) => {
      const details = {
        entity: { uuid: 'e' },
        source: {}
      };
      if (options.submission === true) {
        const submission = testData.extendedSubmissions.createPast(1).last();
        details.source = { submission: { ...submission, xmlFormId: 'f' } };
      }
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details
      });
    };

    it('shows the correct icon', () => {
      createEntity();
      const icon = mountComponent().find('.feed-entry-title .icon-magic');
      icon.exists().should.be.true;
    });

    it('shows the version number', () => {
      createEntity();
      const tag = mountComponent().get('.entity-version-tag');
      tag.text().should.equal('v1');
      tag.getComponent(RouterLinkStub).props().to.should.equal('#v1');
    });

    it('indicates if the entity was created offline', () => {
      createEntity();
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1 });
      const title = mountComponent().get('.feed-entry-title');
      title.find('.offline-update').exists().should.be.true;
    });

    describe('entity was created from a submission', () => {
      beforeEach(() => {
        createEntity({ submission: true });
      });

      it('shows the correct text', () => {
        const title = mountComponent().get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Created Entity dogwood in trees Entity List');
      });

      it('links to the dataset', () => {
        const title = mountComponent().get('.feed-entry-title');
        title.getComponent(DatasetLink).props().should.eql({
          projectId: '1',
          name: 'trees'
        });
      });
    });

    describe('entity was created using the API', () => {
      beforeEach(createEntity);

      it('shows the correct text', () => {
        const title = mountComponent().get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Entity dogwood created by Alice');
      });

      it('links to the user', () => {
        const title = mountComponent().get('.feed-entry-title');
        const actorLink = title.getComponent(ActorLink);
        actorLink.props().actor.displayName.should.equal('Alice');
      });
    });
  });

  describe('entity.bulk.create audit event', () => {
    beforeEach(() => {
      testData.extendedAudits.createPast(1, {
        action: 'entity.bulk.create',
        details: { source: { name: 'my_file.csv' } }
      });
    });

    it('shows the correct icon', () => {
      const component = mountComponent();
      const icon = component.find('.feed-entry-title .icon-cloud-upload');
      icon.exists().should.be.true;
    });

    it('shows the correct text in top of event block', () => {
      const component = mountComponent();
      const text = component.get('.feed-entry-title .bulk-event').text();
      text.should.equal('Created Entity dogwood in trees Entity List');
    });

    it('links to the dataset in the top of the event block', () => {
      const title = mountComponent().get('.feed-entry-title .bulk-event');
      title.getComponent(DatasetLink).props().should.eql({
        projectId: '1',
        name: 'trees'
      });
    });

    it('shows the correct text in bottom of event block', () => {
      const component = mountComponent();
      const text = component.get('.feed-entry-title .bulk-source').text();
      text.should.equal('File my_file.csv uploaded by Alice');
    });

    it('links to actor in bottom of event block', () => {
      const component = mountComponent();
      const title = component.get('.feed-entry-title .bulk-source');
      const actorLink = title.getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('Alice');
    });
  });

  describe('entity.update.version audit event', () => {
    const updateViaAPI = () => {
      testData.extendedEntityVersions.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.update.version',
        details: { source: {} }
      });
    };
    const updateEntityFromSubmission = ({ deleted = false, ...submissionOptions } = {}) => {
      // create the submission this event is based on
      const fullSubmission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's', ...submissionOptions })
        .last();
      // return either full or partial submission info depending on if submission was deleted
      const submission = (deleted)
        ? { instanceId: fullSubmission.instanceId, submitter: fullSubmission.submitter, createdAt: fullSubmission.createdAt }
        : { ...fullSubmission, xmlFormId: 'f' }; // full submission augmented with form id

      if (testData.extendedEntityVersions.size === 1)
        testData.extendedEntityVersions.createPast(1);

      const details = {
        entity: { uuid: 'e' },
        source: { submission } // source would also have `event` but that is not used in this component
      };
      const audit = testData.extendedAudits
        .createPast(1, {
          action: 'entity.update.version',
          details
        })
        .last();

      return {
        entry: audit,
        submission
      };
    };

    it('shows the correct icon', () => {
      updateViaAPI();
      const component = mountComponent();
      const icon = component.find('.feed-entry-title .icon-pencil');
      icon.exists().should.be.true;
    });

    it('shows the version number', () => {
      updateViaAPI();
      const tag = mountComponent().get('.entity-version-tag');
      tag.text().should.equal('v2');
      tag.getComponent(RouterLinkStub).props().to.should.equal('#v2');
    });

    it('indicates if the update was an offline update', () => {
      testData.extendedEntityVersions
        .createPast(1, { branchId: 'b1', trunkVersion: null, branchBaseVersion: 1 });
      const component = mountComponent({ props: updateEntityFromSubmission() });
      const title = component.get('.feed-entry-title');
      title.find('.offline-update').exists().should.be.true;
    });

    it('renders a diff', () => {
      updateViaAPI();
      mountComponent().findComponent(EntityDiff).exists().should.be.true;
    });

    describe('update via API', () => {
      it('shows the correct text', () => {
        updateViaAPI();
        const title = mountComponent().get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Data updated by Alice');
      });

      it('links to the user', () => {
        updateViaAPI();
        const title = mountComponent().get('.feed-entry-title');
        const actorLink = title.getComponent(ActorLink);
        actorLink.props().actor.displayName.should.equal('Alice');
      });
    });

    describe('update via submission', () => {
      it('shows the correct text with submission instance ID', () => {
        const component = mountComponent({ props: updateEntityFromSubmission() });
        const title = component.get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Data updated by Submission s');
      });

      it('shows the correct text with submission instance name', () => {
        const component = mountComponent({
          props: updateEntityFromSubmission({
            meta: { instanceName: 'Some Name' }
          })
        });
        const title = component.get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Data updated by Submission Some Name');
      });

      it('links to the submission', () => {
        const component = mountComponent({
          props: updateEntityFromSubmission({
            meta: { instanceName: 'Some Name' }
          })
        });
        const title = component.get('.feed-entry-title');
        const link = title.getComponent(SubmissionLink);
        link.props().should.include({ projectId: '1', xmlFormId: 'f' });
        const { submission } = link.props();
        submission.instanceId.should.equal('s');
        submission.currentVersion.instanceName.should.equal('Some Name');
      });

      it('shows the correct text with deleted submission instance id', () => {
        const component = mountComponent({ props: updateEntityFromSubmission({ deleted: true }) });
        const title = component.get('.feed-entry-title');
        const text = textWithout(title, '.entity-version-tag');
        text.should.equal('Data updated by (deleted Submission s)');
      });

      it('does not link to the deleted submission', () => {
        const component = mountComponent({
          props: updateEntityFromSubmission({ deleted: true })
        });
        component.findComponent(SubmissionLink).exists().should.be.false;
      });
    });
  });

  describe('entity.update.resolve audit event', () => {
    beforeEach(() => {
      testData.extendedAudits.createPast(1, {
        action: 'entity.update.resolve'
      });
    });

    it('shows the correct icon', () => {
      const component = mountComponent();
      const icon = component.find('.feed-entry-title .icon-random');
      icon.exists().should.be.true;
    });

    it('shows the correct text', () => {
      const text = mountComponent().get('.feed-entry-title').text();
      text.should.equal('Conflict warning resolved by Alice');
    });

    it('links to the user', () => {
      const title = mountComponent().get('.feed-entry-title');
      const actorLink = title.getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('Alice');
    });
  });

  it('shows when an audit log event was logged', () => {
    testData.extendedEntityVersions.createPast(1);
    const audit = testData.extendedAudits
      .createPast(1, { action: 'entity.update.version', details: {} })
      .last();
    const component = mountComponent();
    component.getComponent(FeedEntry).props().iso.should.equal(audit.loggedAt);
  });
});
