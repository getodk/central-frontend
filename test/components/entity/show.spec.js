import EntityConflictSummary from '../../../src/components/entity/conflict-summary.vue';
import EntityDelete from '../../../src/components/entity/delete.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';
import NotFound from '../../../src/components/not-found.vue';
import Breadcrumbs from '../../../src/components/breadcrumbs.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('EntityShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/projects/p/entity-lists/trees/entities/e', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true;
  });

  it('validates the uuid route param', async () => {
    const component = await load('/projects/1/entity-lists/trees/entities/e f', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true;
  });

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
      .testRequests([
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e', extended: true },
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions', extended: true }
      ]);
  });

  it('renders breadcrumbs', async () => {
    testData.extendedProjects.createPast(1, { name: 'My Project' });
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e', label: 'My Entity' });
    const component = await load('/projects/1/entity-lists/%C3%A1/entities/e', {
      root: false
    });
    const { links } = component.getComponent(Breadcrumbs).props();
    links.length.should.equal(3);
    links[0].text.should.equal('My Project');
    links[0].path.should.equal('/projects/1/entity-lists');
    links[1].text.should.equal('á');
    links[1].path.should.equal('/projects/1/entity-lists/%C3%A1');
    links[2].text.should.equal('My Entity');
    should.not.exist(links[2].path);
  });

  it('shows the entity label', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'e', label: 'My Entity' });
    const component = await load('/projects/1/entity-lists/trees/entities/e', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('My Entity');
  });

  describe('after a successful update', () => {
    const submit = () => {
      testData.extendedDatasets.createPast(1, {
        name: 'á',
        properties: [{ name: 'height' }],
        entities: 1
      });
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity',
        data: { height: '1' }
      });
      return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#entity-data-update-button').trigger('click');
          const form = component.get('#entity-update form');
          const textareas = form.findAll('textarea');
          textareas.length.should.equal(2);
          await textareas[0].setValue('Updated Entity');
          await textareas[1].setValue('2');
          return form.trigger('submit');
        })
        .respondWithData(() => {
          testData.extendedEntityVersions.createNew({
            label: 'Updated Entity',
            data: { height: '2' }
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version',
            details: { source: {} }
          });
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedEntityVersions.sorted());
    };

    it('sends the correct requests for activity data', () =>
      submit().testRequests([
        null,
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions', extended: true }
      ]));

    it('hides the modal', async () => {
      const component = await submit();
      component.getComponent(EntityUpdate).props().state.should.be.false;
    });

    it('shows a success alert', async () => {
      const component = await submit();
      component.should.alert('success');
    });

    it('updates the label', async () => {
      const component = await submit();
      component.get('#page-head-title').text().should.equal('Updated Entity');
    });

    it('updates the entity data', async () => {
      const component = await submit();
      component.get('#entity-data dd').text().should.equal('2');
    });

    it('updates the number of entries in the feed');

    it('updates the conflict status', () => {
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity'
      });
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return load('/projects/1/entity-lists/trees/entities/e', { root: false })
        .afterResponses(component => {
          component.findComponent(EntityConflictSummary).exists().should.be.true;
        })
        .request(async (component) => {
          await component.get('#entity-data-update-button').trigger('click');
          const form = component.get('#entity-update form');
          await form.get('textarea').setValue('Updated Entity');
          return form.trigger('submit');
        })
        .respondWithData(() => {
          // Another user has resolved the conflict since the page was loaded.
          testData.extendedEntities.resolve(-1);
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.resolve'
          });

          testData.extendedEntityVersions.createNew({
            label: 'Updated Entity'
          });
          testData.extendedAudits.createPast(1, {
            action: 'entity.update.version',
            details: { source: {} }
          });

          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedEntityVersions.sorted())
        .afterResponses(component => {
          component.findComponent(EntityConflictSummary).exists().should.be.false;
        });
    });
  });

  describe('after a conflict is marked as resolved', () => {
    it('sends the correct requests for activity data', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#entity-conflict-summary .btn-default').trigger('click');
          await component.get('.confirmation .btn-primary').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        })
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedEntityVersions.sorted())
        .testRequests([
          null,
          { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
          { url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions', extended: true }
        ]);
    });
  });

  describe('delete', () => {
    it('toggles the modal', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/trees/entities/e', { root: false })
        .testModalToggles({
          modal: EntityDelete,
          show: '#entity-activity-delete-button',
          hide: '.btn-link'
        });
    });

    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/%C3%A1/entities/e', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#entity-activity-delete-button').trigger('click');
          return component.get('#entity-delete .btn-danger').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/projects/1/datasets/%C3%A1/entities/e'
        }]);
    });

    it('implements some standard button things', () => {
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/trees/entities/e', { root: false })
        .afterResponses(component =>
          component.get('#entity-activity-delete-button').trigger('click'))
        .testStandardButton({
          button: '#entity-delete .btn-danger',
          disabled: ['#entity-delete .btn-link'],
          modal: EntityDelete
        });
    });

    describe('after a successful response', () => {
      const del = () => {
        testData.extendedEntities.createPast(1, {
          uuid: 'e',
          label: 'My Entity'
        });
        return load('/projects/1/entity-lists/trees/entities/e')
          .complete()
          .request(async (app) => {
            await app.get('#entity-activity-delete-button').trigger('click');
            return app.get('#entity-delete .btn-danger').trigger('click');
          })
          .respondWithSuccess()
          .respondFor('/projects/1/entity-lists/trees/entities', {
            project: false
          });
      };

      it('redirects to the Data page', async () => {
        const app = await del();
        const { path } = app.vm.$route;
        path.should.equal('/projects/1/entity-lists/trees/entities');
      });

      it('shows a success alert', async () => {
        const app = await del();
        app.should.alert('success', 'Entity “My Entity” has been deleted.');
      });
    });

    it('ignores the 404 error', () => {
      testData.extendedEntities.createPast(1, {
        uuid: 'e',
        label: 'My Entity'
      });
      return load('/projects/1/entity-lists/trees/entities/e')
        .complete()
        .request(async (app) => {
          await app.get('#entity-activity-delete-button').trigger('click');
          return app.get('#entity-delete .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1)
        .respondFor('/projects/1/entity-lists/trees/entities', {
          project: false
        })
        .afterResponses((app) => {
          app.should.alert('success', 'Entity “My Entity” has been deleted.');
        });
    });
  });
});
