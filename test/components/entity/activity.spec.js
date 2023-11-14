import EntityActivity from '../../../src/components/entity/activity.vue';
import EntityFeedEntry from '../../../src/components/entity/feed-entry.vue';

import useEntity from '../../../src/request-data/entity';

import testData from '../../data';
import { load } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';
import { wait } from '../../util/util';

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
    it('sets data-version attributes correctly', () => {
      resolveConflict();
      mountComponent().findAll('.feed-entry-group')
        .map(group => group.attributes('data-version'))
        .should.eql([undefined, '3', '2', '1']);
    });

    it('adds scroll-target class if data-version matches route hash', () => {
      resolveConflict();
      const component = mountComponent({
        container: {
          router: mockRouter('/projects/1/entity-lists/trees/entities/e#v2')
        }
      });
      component.findAll('.feed-entry-group')
        .map(group => group.classes('scroll-target'))
        .should.eql([false, false, true, false]);
    });

    // Creates an entity with 50 versions. Creating a large number of versions
    // helps ensure that the versions we scroll to are at the top of the
    // viewport. (In contrast, the last version is always toward the bottom.)
    const createV50 = () => {
      mockLogin();
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity'
      });
      testData.extendedAudits.createPast(1, {
        action: 'entity.create',
        details: {}
      });
      for (let version = 2; version <= 50; version += 1) {
        testData.extendedEntityVersions.createPast(1);
        testData.extendedAudits.createPast(1, {
          action: 'entity.update.version',
          details: {}
        });
      }
    };
    const pxTo = (wrapper) =>
      Math.floor(wrapper.element.getBoundingClientRect().y);

    it('scrolls to a target that already exists in the DOM', async () => {
      createV50();
      const app = await load('/projects/1/entity-lists/trees/entities/e', {
        attachTo: document.body
      });

      // Scroll to v40.
      await app.vm.$router.push('/projects/1/entity-lists/trees/entities/e#v40');
      // Scrolling doesn't seem to be synchronous, so we wait in order to give
      // it a chance to complete. Even nextTick() didn't work here for some
      // reason.
      await wait();
      const yForV40 = window.scrollY;
      yForV40.should.be.above(0);
      pxTo(app.get('[data-version="40"]')).should.equal(10);

      // Scroll to v20 even farther below.
      await app.vm.$router.push('/projects/1/entity-lists/trees/entities/e#v20');
      await wait();
      window.scrollY.should.be.above(yForV40);
      pxTo(app.get('[data-version="20"]')).should.equal(10);
    });

    it('waits for the scroll target to appear in the DOM', async () => {
      createV50();
      // The scroll target will not exist until responses are received, yet the
      // page should scroll to it once it exists.
      const app = await load('/projects/1/entity-lists/trees/entities/e#v40', {
        attachTo: document.body
      });
      window.scrollY.should.be.above(0);
      pxTo(app.get('[data-version="40"]')).should.equal(10);
    });

    it('does not scroll for an invalid hash', async () => {
      createV50();
      await load('/projects/1/entity-lists/trees/entities/e#foo', {
        attachTo: document.body
      });
      window.scrollY.should.equal(0);
    });

    describe('after the feed is refreshed', () => {
      beforeEach(createV50);

      const updateEntity = (series) => series
        .request(async (app) => {
          await app.get('#entity-data-update-button').trigger('click');
          const form = app.get('#entity-update form');
          await form.get('textarea').setValue('Updated Entity');
          return form.trigger('submit');
        })
        .respondWithData(() => {
          testData.extendedEntityVersions.createNew({
            label: 'Updated Entity'
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version',
            details: {}
          });
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedEntityVersions.sorted());

      it('does not scroll again', () =>
        load('/projects/1/entity-lists/trees/entities/e#v40', {
          attachTo: document.body
        })
          .afterResponses(() => {
            // After scrolling to the top, we should see that we stay there.
            window.scrollTo(0, 0);
          })
          .modify(updateEntity)
          .afterResponses(() => {
            window.scrollY.should.equal(0);
          }));

      it('no longer highlights the feed entry', () =>
        load('/projects/1/entity-lists/trees/entities/e#v40', {
          attachTo: document.body
        })
          .complete()
          .modify(updateEntity)
          .afterResponses(app => {
            app.find('.scroll-target').exists().should.be.false();
          }));
    });
  });
});
