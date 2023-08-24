import { RouterLinkStub } from '@vue/test-utils';

import ActorLink from '../../../src/components/actor-link.vue';
import DiffItem from '../../../src/components/diff-item.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';
import FeedEntry from '../../../src/components/feed-entry.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options) =>
  mount(EntityFeedEntry, mergeMountOptions(options, {
    global: {
      provide: { projectId: '1', datasetName: 'trees' }
    },
    props: { entry: testData.extendedAudits.last() },
    container: {
      router: mockRouter('/projects/1/entity-lists/trees/entities/e'),
      requestData: testRequestData([useEntity], {
        entity: testData.extendedEntities.last()
      })
    }
  }));

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
      const submission = testData.extendedSubmissions
        .createPast(1, { instanceId: 's', ...options })
        .last();
      const audit = testData.extendedAudits
        .createPast(1, {
          action: 'submission.create',
          details: { instanceId: 's' }
        })
        .last();
      return {
        entry: audit,
        submission: deleted ? null : { ...submission, xmlFormId: 'f' }
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
        testData.extendedSubmissions.createPast(1);
        details.submissionCreate = testData.extendedAudits
          .createPast(1, { action: 'submission.create' })
          .last();
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

  describe('entity.update.version audit event', () => {
    const updateEntity = () => {
      const audit = testData.extendedAudits
        .createPast(1, { action: 'entity.update.version' })
        .last();
      return { entry: audit, diff: [] };
    };

    it('shows the correct icon', () => {
      const component = mountComponent({ props: updateEntity() });
      const icon = component.find('.feed-entry-title .icon-pencil');
      icon.exists().should.be.true();
    });

    it('shows the correct text', () => {
      const component = mountComponent({ props: updateEntity() });
      const text = component.get('.feed-entry-title').text();
      text.should.equal('Data updated by Alice');
    });

    it('links to the user', () => {
      const component = mountComponent({ props: updateEntity() });
      const title = component.get('.feed-entry-title');
      const actorLink = title.getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('Alice');
    });

    it('renders a DiffItem for each change', () => {
      const diff = [
        { new: '1', old: '10', propertyName: 'height' },
        { new: '2', old: '20', propertyName: 'circumference' }
      ];
      const component = mountComponent({
        props: { ...updateEntity(), diff }
      });
      component.findAllComponents(DiffItem).length.should.equal(2);
    });

    it('passes the correct props to the DiffItem', () => {
      const diff = [{ new: '1', old: '10', propertyName: 'height' }];
      const component = mountComponent({
        props: { ...updateEntity(), diff }
      });
      const props = component.getComponent(DiffItem).props();
      props.new.should.equal('1');
      props.old.should.equal('10');
      props.path.should.eql(['height']);
    });
  });

  it('shows when an audit log event was logged', () => {
    const audit = testData.extendedAudits
      .createPast(1, { action: 'entity.update.version' })
      .last();
    const component = mountComponent({
      props: { entry: audit, diff: [] }
    });
    component.getComponent(FeedEntry).props().iso.should.equal(audit.loggedAt);
  });

  it('lists submission events immediately below entity.create event', async () => {
    const sourceDetails = testData.extendedEntities
      .createSourceSubmission('submission.update');
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    testData.extendedAudits.createPast(1, {
      action: 'entity.create',
      details: sourceDetails
    });
    const component = await load('/projects/1/entity-lists/trees/entities/e', {
      root: false,
      attachTo: document.body
    });
    const margin = component.findAllComponents(EntityFeedEntry)
      .map(({ element }) => {
        const { marginTop, marginBottom } = getComputedStyle(element);
        return {
          top: marginTop === '' ? 0 : Number.parseFloat(marginTop),
          bottom: marginBottom === '' ? 0 : Number.parseFloat(marginBottom)
        };
      });
    margin.length.should.equal(3);
    margin[0].top.should.equal(0);
    (margin[0].bottom + margin[1].top).should.equal(1);
    (margin[1].bottom + margin[2].top).should.equal(1);
    margin[2].bottom.should.equal(20);
  });
});
