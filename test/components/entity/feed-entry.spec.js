import { RouterLinkStub } from '@vue/test-utils';
import { last } from 'ramda';

import ActorLink from '../../../src/components/actor-link.vue';
import EntityDiff from '../../../src/components/entity/diff.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';
import FeedEntry from '../../../src/components/feed-entry.vue';

import useEntity from '../../../src/request-data/entity';
import useEntityVersions from '../../../src/request-data/entity-versions';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) => {
  const entity = testData.extendedEntities.last();
  const container = createTestContainer({
    router: mockRouter(`/projects/1/entity-lists/trees/entities/${entity.uuid}`),
    requestData: testRequestData([useEntity, useEntityVersions], {
      entity,
      entityVersions: testData.extendedEntityVersions.sorted()
    })
  });
  return mount(EntityFeedEntry, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees', uuid: entity.uuid }
    },
    props: {
      entry: testData.extendedAudits.last(),
      entityVersion: testData.extendedEntityVersions.size > 1
        ? last(container.requestData.localResources.entityVersions)
        : null
    },
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
      icon.exists().should.be.true();
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
        const component = mountComponent({ props: createSubmission() });
        const title = component.get('.feed-entry-title');
        const { to } = title.getComponent(RouterLinkStub).props();
        to.should.equal('/projects/1/forms/f/submissions/s');
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
        const links = component.findAllComponents(RouterLinkStub);
        links.length.should.equal(1);
        links[0].props().to.should.startWith('/users/');
      });
    });
  });

  describe('submission.update audit event', () => {
    beforeEach(() => {
      testData.extendedAudits.createPast(1, { action: 'submission.update' });
    });

    it('shows the correct icon', () => {
      const component = mountComponent();
      const icon = component.find('.feed-entry-title .icon-check-circle');
      icon.exists().should.be.true();
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
        entity: { uuid: 'e' }
      };
      if (options.submission === true) {
        const submission = testData.extendedSubmissions.createPast(1);
        details.submission = { ...submission, xmlFormId: 'f' };
      }
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details
      });
    };

    it('shows the correct icon', () => {
      createEntity();
      const icon = mountComponent().find('.feed-entry-title .icon-magic-wand');
      icon.exists().should.be.true();
    });

    describe('entity was created from a submission', () => {
      beforeEach(() => {
        createEntity({ submission: true });
      });

      it('shows the correct text', () => {
        const text = mountComponent().get('.feed-entry-title').text();
        text.should.equal('Created Entity dogwood in trees Entity List');
      });

      // TODO: also check text if sub is deleted

      it('links to the dataset', () => {
        const title = mountComponent().get('.feed-entry-title');
        const { to } = title.getComponent(RouterLinkStub).props();
        to.should.equal('/projects/1/entity-lists/trees');
      });
    });

    describe('entity was created using the API', () => {
      beforeEach(createEntity);

      it('shows the correct text', () => {
        const text = mountComponent().get('.feed-entry-title').text();
        text.should.equal('Entity dogwood created by Alice');
      });

      it('links to the user', () => {
        const title = mountComponent().get('.feed-entry-title');
        const actorLink = title.getComponent(ActorLink);
        actorLink.props().actor.displayName.should.equal('Alice');
      });
    });
  });

  describe('entity.update.version (via API) audit event', () => {
    beforeEach(() => {
      testData.extendedEntityVersions.createPast(1);
      testData.extendedAudits.createPast(1, {
        action: 'entity.update.version',
        details: {}
      });
    });

    it('shows the correct icon', () => {
      const component = mountComponent();
      const icon = component.find('.feed-entry-title .icon-pencil');
      icon.exists().should.be.true();
    });

    it('shows the correct text', () => {
      const component = mountComponent();
      const text = component.get('.feed-entry-title .title').text();
      text.should.equal('Data updated by Alice');
    });

    it('links to the user', () => {
      const component = mountComponent();
      const title = component.get('.feed-entry-title');
      const actorLink = title.getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('Alice');
    });

    it('shows the version number', () => {
      const component = mountComponent();
      const version = component.get('.feed-entry-title .entity-version-tag').text();
      version.should.equal('v2');
    });
  });

  describe('entity.update.version (via submission) audit event', () => {
    const updateEntityFromSubmission = ({ deleted = false, ...options } = {}) => {
      // create the submission this event is based on
      const fullSubmission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's', ...options })
        .last();

      // return either full or partial submission info depending on if submission was deleted
      const submission = (deleted)
        ? { instanceId: fullSubmission.instanceId, submitter: fullSubmission.submitter, createdAt: fullSubmission.createdAt }
        : { ...fullSubmission, xmlFormId: 'f' }; // full submission augmented with form id

      const details = {
        entity: { uuid: 'e' },
        submission
      };

      testData.extendedEntityVersions.createPast(1);
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
      const component = mountComponent({ props: updateEntityFromSubmission() });
      const icon = component.find('.feed-entry-title .icon-pencil');
      icon.exists().should.be.true();
    });

    it('shows the correct text with submission instance ID', () => {
      const component = mountComponent({ props: updateEntityFromSubmission() });
      const text = component.get('.feed-entry-title .title').text();
      text.should.equal('Data updated by Submission s');
    });

    it('shows the correct text with submission instance name', () => {
      const component = mountComponent({ props: updateEntityFromSubmission({ meta: { instanceName: 'Some Name' } }) });
      const text = component.get('.feed-entry-title  .title').text();
      text.should.equal('Data updated by Submission Some Name');
    });

    it('links to the submission', () => {
      const component = mountComponent({ props: updateEntityFromSubmission() });
      const title = component.get('.feed-entry-title .title');
      const { to } = title.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/submissions/s');
    });

    it('shows the correct text with deleted submission instance id', () => {
      const component = mountComponent({ props: updateEntityFromSubmission({ deleted: true }) });
      const text = component.get('.feed-entry-title .title').text();
      text.should.equal('Data updated by (deleted Submission s)');
    });

    it('does not link to the deleted submission', () => {
      const component = mountComponent({
        props: updateEntityFromSubmission({ deleted: true })
      });
      const links = component.findAllComponents(RouterLinkStub);
      links.length.should.equal(1); // only link is anchor link on version tag
    });

    it('shows the version number', () => {
      const component = mountComponent({ props: updateEntityFromSubmission() });
      const version = component.get('.feed-entry-title .entity-version-tag').text();
      version.should.equal('v2');
    });
  });

  it('renders a diff for an entity.update.version event', () => {
    testData.extendedEntityVersions.createPast(1);
    testData.extendedAudits.createPast(1, {
      action: 'entity.update.version',
      details: {}
    });
    mountComponent().findComponent(EntityDiff).exists().should.be.true();
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
      icon.exists().should.be.true();
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
