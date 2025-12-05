import { faker } from '@faker-js/faker';
import { nextTick } from 'vue';
import sinon from 'sinon';
import DateTime from '../../../src/components/date-time.vue';
import EntityDataRow from '../../../src/components/entity/data-row.vue';
import EntityDelete from '../../../src/components/entity/delete.vue';
import EntityRestore from '../../../src/components/entity/restore.vue';
import EntityList from '../../../src/components/entity/list.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import EntityResolve from '../../../src/components/entity/resolve.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';

import testData from '../../data';
import { loadEntityList } from '../../util/entity';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { testRouter } from '../../util/router';
import { relativeUrl } from '../../util/request';

// Create entities along with the associated project and dataset.
const createEntities = (count, factoryOptions = {}) => {
  testData.extendedProjects.createPast(1);
  testData.extendedDatasets.createPast(1, { entities: count });
  testData.extendedEntities.createPast(count, factoryOptions);
};

describe('EntityList', () => {
  beforeEach(mockLogin);

  it('sends the correct requests for a dataset', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    return load(
      '/projects/1/entity-lists/trees/entities',
      { root: false }
    ).testRequests([
      {
        url: ({ pathname, searchParams }) => {
          // Request to get count of deleted Entities
          pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
          searchParams.get('$filter').should.match(/__system\/deletedAt ne null/);
          searchParams.get('$top').should.be.eql('0');
        }
      },
      { url: '/v1/projects/1/datasets/trees/entities/creators' },
      {
        url: ({ pathname, searchParams }) => {
          // Request to get all the Entities created before now and ( not deleted or deleted after now)
          pathname.should.be.eql('/v1/projects/1/datasets/trees.svc/Entities');
          searchParams.get('$filter').should.match(/__system\/createdAt le \S+ and \(__system\/deletedAt eq null or __system\/deletedAt gt \S+\)/);
          searchParams.get('$top').should.be.eql('250');
        }
      },
    ]);
  });

  it('updates dataset.entities using the OData count', () => {
    testData.extendedEntities.createPast(1);
    return load('/projects/1/entity-lists/trees/properties')
      .afterResponses(() => {
        testData.extendedEntities.createNew();
      })
      .load('/projects/1/entity-lists/trees/entities', {
        project: false,
        dataset: false
      })
      .beforeAnyResponse(app => {
        app.vm.$container.requestData.dataset.entities.should.equal(1);
        app.get('#page-head-tabs li.active .badge').text().should.equal('1');
      })
      .afterResponse(app => {
        app.vm.$container.requestData.dataset.entities.should.equal(2);
        app.get('#page-head-tabs li.active .badge').text().should.equal('2');
      });
  });

  it('shows a message if there are no entities', async () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = await load(
      '/projects/1/entity-lists/trees/entities',
      { root: false }
    );
    component.getComponent(EntityList).get('.empty-table-message').should.be.visible();
  });

  describe('after the refresh button is clicked', () => {
    it('completes a background refresh', () => {
      const clock = sinon.useFakeTimers(Date.now());
      let initialTime;
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      const assertRowCount = (count) => (component, _, i) => {
        if (i === 0 || i == null) {
          component.findAllComponents(EntityMetadataRow).length.should.equal(count);
          component.findAllComponents(EntityDataRow).length.should.equal(count);
        }
      };
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .afterResponses(component => {
          assertRowCount(1)(component);
          initialTime = component.get('.table-refresh-bar span').text();
        })
        .request(component => {
          clock.tick(1000);
          return component.get('#refresh-button').trigger('click');
        })
        .beforeEachResponse(assertRowCount(1))
        .respondWithData(() => {
          testData.extendedEntities.createNew();
          return testData.entityOData();
        })
        .respondWithData(testData.entityDeletedOData)
        .afterResponse(component => {
          assertRowCount(2)(component);
          const newTime = component.get('.table-refresh-bar span').text();
          newTime.should.not.equal(initialTime);
        });
    });

    it('does not show a loading message', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse(component => {
          component.get('#odata-loading-message').should.be.hidden();
        })
        .respondWithData(testData.entityOData)
        .respondWithData(testData.entityDeletedOData);
    });
  });

  describe('update', () => {
    it('toggles the Modal', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .testModalToggles({
          modal: EntityUpdate,
          show: '.entity-metadata-row .update-button',
          hide: ['.btn-link']
        });
    });

    it('passes the correct entity to the modal', async () => {
      testData.extendedEntities
        .createPast(1, { uuid: 'e1' })
        .createPast(1, { uuid: 'e2' });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      const modal = component.getComponent(EntityUpdate);
      should.not.exist(modal.props().entity);
      const buttons = component.findAll('.entity-metadata-row .update-button');
      buttons.length.should.equal(2);
      await buttons[0].trigger('click');
      modal.props().entity.uuid.should.equal('e2');
      await modal.get('.btn-link').trigger('click');
      await buttons[1].trigger('click');
      modal.props().entity.uuid.should.equal('e1');
    });

    it('passes a REST-format entity to the modal', async () => {
      testData.extendedDatasets.createPast(1, {
        properties: [
          { name: 'height' },
          { name: 'circumference.cm', odataName: 'circumference_cm' }
        ]
      });
      testData.extendedEntities.createPast(1, {
        uuid: 'abc',
        label: 'My Entity',
        data: { height: '1', 'circumference.cm': '2' }
      });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      await component.get('.entity-metadata-row .update-button').trigger('click');
      const { entity } = component.getComponent(EntityUpdate).props();
      entity.uuid.should.equal('abc');
      entity.currentVersion.should.eql({
        label: 'My Entity',
        version: 1,
        data: Object.assign(Object.create(null), {
          height: '1',
          'circumference.cm': '2'
        })
      });
    });

    it('does not show the modal during a refresh of the table', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse(async (component) => {
          await component.get('.entity-metadata-row .update-button').trigger('click');
          component.getComponent(EntityUpdate).props().state.should.be.false;
        })
        .respondWithData(testData.entityOData)
        .respondWithData(testData.entityDeletedOData)
        .afterResponse(component => {
          component.getComponent(EntityUpdate).props().state.should.be.false;
        });
    });

    describe('after a successful response', () => {
      const submit = () => {
        testData.extendedDatasets.createPast(1, {
          properties: [
            { name: 'height' },
            { name: 'circumference.cm', odataName: 'circumference_cm' }
          ]
        });
        testData.extendedEntities.createPast(1, { uuid: 'e1' });
        testData.extendedEntities.createPast(1, {
          uuid: 'e2',
          label: 'My Entity',
          data: { height: '1', 'circumference.cm': '2' }
        });
        testData.extendedEntities.createPast(1, { uuid: 'e3' });
        return load('/projects/1/entity-lists/trees/entities', { root: false })
          .complete()
          .request(async (component) => {
            await component.get('.entity-metadata-row:nth-child(2) .update-button').trigger('click');
            const form = component.get('#entity-update form');
            const textareas = form.findAll('textarea');
            textareas.length.should.equal(3);
            await textareas[0].setValue('Updated Entity');
            await textareas[1].setValue('3');
            await textareas[2].setValue('4');
            return form.trigger('submit');
          })
          .respondWithData(() => {
            testData.extendedEntityVersions.createNew({
              uuid: 'e2',
              label: 'Updated Entity',
              data: { height: '3', 'circumference.cm': '4' }
            });
            return testData.standardEntities.get(1);
          });
      };

      it('hides the modal', async () => {
        const component = await submit();
        component.getComponent(EntityUpdate).props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await submit();
        component.should.alert('success');
      });

      it('updates the EntityDataRow', async () => {
        const component = await submit();
        const tds = component.findAll('.entity-data-row:nth-child(2) td');
        tds.map(td => td.text()).should.eql(['3', '4', 'Updated Entity', 'e2']);
      });

      it('updates the EntityMetadataRow', async () => {
        const component = await submit();
        const td = component.get('.entity-metadata-row:nth-child(2) td:last-child');
        should.exist(td.getComponent(DateTime).props().iso);
        td.get('.updates').text().should.equal('1');
        td.get('.update-button').attributes('aria-label').should.equal('Edit (1)');
      });
    });
  });

  describe('resolve', () => {
    const relevantToConflict = () => testData.extendedEntityVersions.sorted()
      .filter(version => version.relevantToConflict);

    it('toggles the Modal', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .testModalToggles({
          modal: EntityResolve,
          show: '.entity-metadata-row .resolve-button',
          hide: ['.btn-primary'],
          respond: (series) => series.respondWithData(relevantToConflict)
        });
    });

    it('passes the correct entity to the modal', () => {
      testData.extendedEntities
        .createPast(1, { uuid: 'e1' })
        .createPast(1, { uuid: 'e2' });
      testData.extendedEntityVersions
        .createPast(2, { uuid: 'e1', baseVersion: 1 })
        .createPast(2, { uuid: 'e2', baseVersion: 1 });
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .afterResponses(component => {
          const modal = component.getComponent(EntityResolve);
          should.not.exist(modal.props().entity);
        })
        .request(component => {
          const button = component.get('.entity-metadata-row:first-child .resolve-button');
          return button.trigger('click');
        })
        .respondWithData(relevantToConflict)
        .afterResponse(component => {
          const modal = component.getComponent(EntityResolve);
          modal.props().entity.__id.should.equal('e2');
          return modal.get('.btn-primary').trigger('click');
        })
        .request(component => {
          const button = component.get('.entity-metadata-row:nth-child(2) .resolve-button');
          return button.trigger('click');
        })
        .respondWithData(relevantToConflict)
        .afterResponse(component => {
          const modal = component.getComponent(EntityResolve);
          modal.props().entity.__id.should.equal('e1');
        });
    });

    it('does not show the modal during a refresh of the table', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });

      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeEachResponse(async (component) => {
          await component.get('.entity-metadata-row .resolve-button').trigger('click');
          component.getComponent(EntityResolve).props().state.should.be.false;
        })
        .respondWithData(testData.entityOData)
        .respondWithData(testData.entityDeletedOData)
        .afterResponse(component => {
          component.getComponent(EntityResolve).props().state.should.be.false;
        });
    });

    it('removes the conflict icon after conflict resolution', () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component => {
          component.get('.wrap-circle').exists().should.be.true;
          return component.get('.entity-metadata-row .resolve-button').trigger('click');
        })
        .respondWithData(relevantToConflict)
        .complete()
        .request(component =>
          component.get('#entity-resolve .mark-as-resolved').trigger('click'))
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        })
        .afterResponse(component => {
          component.find('.wrap-circle').exists().should.be.false;
          component.find('.resolve-button').exists().should.be.false;
        });
    });

    describe('Edit Entity from Resolve Modal', () => {
      const openUpdateFromResolve = async () => {
        testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
        testData.extendedEntities.createPast(1, {
          uuid: 'e',
          label: 'My Entity'
        });
        testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
        const mockHttp = load('/projects/1/entity-lists/%C3%A1/entities', { root: false })
          .complete()
          .request(component => {
            const button = component.get('.entity-metadata-row .resolve-button');
            return button.trigger('click');
          })
          .respondWithData(relevantToConflict)
          .complete();
        const component = await mockHttp;
        const resolveModal = component.getComponent(EntityResolve);
        const updateModal = component.getComponent(EntityUpdate);
        await resolveModal.find('.edit-entity').trigger('click');
        return { mockHttp, resolveModal, updateModal };
      };

      it('toggles the modals', async () => {
        const { resolveModal, updateModal } = await openUpdateFromResolve();
        resolveModal.props().state.should.be.false;
        updateModal.props().state.should.be.true;
      });

      describe('after a successful update', () => {
        const update = (updateModal) => (series) => series
          .request(async () => {
            const form = updateModal.get('form');
            const textareas = form.findAll('textarea');
            await textareas[0].setValue('Updated Entity');
            await form.trigger('submit');
          })
          .respondWithData(() => {
            testData.extendedEntityVersions.createPast(1, { label: 'Updated Entity' });
            return testData.standardEntities.last();
          })
          .respondWithData(relevantToConflict);

        it('sends a new request for the entity versions', async () => {
          const { mockHttp, updateModal } = await openUpdateFromResolve();
          return mockHttp
            .modify(update(updateModal))
            .testRequests([
              null,
              {
                url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions?relevantToConflict=true',
                extended: true
              }
            ]);
        });

        it('comes back to the resolve modal', async () => {
          const { mockHttp, resolveModal, updateModal } = await openUpdateFromResolve();
          await mockHttp.modify(update(updateModal));
          resolveModal.props().state.should.be.true;
          updateModal.props().state.should.be.false;
        });

        it('shows the updated entity', async () => {
          const { mockHttp, resolveModal, updateModal } = await openUpdateFromResolve();
          await mockHttp.modify(update(updateModal));
          resolveModal.get('.modal-title').text().should.equal('Parallel updates to “Updated Entity”');
        });
      });

      describe('after the update is canceled', () => {
        it('does not request the entity versions', async () => {
          const { mockHttp, updateModal } = await openUpdateFromResolve();
          return mockHttp.testNoRequest(() =>
            updateModal.get('.close').trigger('click'));
        });

        it('comes back to the resolve modal', async () => {
          const { resolveModal, updateModal } = await openUpdateFromResolve();

          await updateModal.get('.close').trigger('click');

          resolveModal.props().state.should.be.true;
          updateModal.props().state.should.be.false;
        });
      });
    });
  });

  describe('delete', () => {
    it('toggles the modal', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .testModalToggles({
          modal: EntityDelete,
          show: '.entity-metadata-row .delete-button',
          hide: '.btn-link'
        });
    });

    it('passes the entity to the modal', async () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      const component = await load('/projects/1/entity-lists/trees/entities', {
        root: false
      });
      await component.get('.entity-metadata-row .delete-button').trigger('click');
      const { entity } = component.getComponent(EntityDelete).props();
      entity.label.should.equal('My Entity');
    });

    it('implements some standard button things', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .afterResponses(component =>
          component.get('.entity-metadata-row .delete-button').trigger('click'))
        .testStandardButton({
          button: '#entity-delete .btn-danger',
          disabled: ['#entity-delete .btn-link'],
          modal: EntityDelete
        });
    });

    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1, { uuid: 'e' });
      return load('/projects/1/entity-lists/%C3%A1/entities', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('.entity-metadata-row .delete-button').trigger('click');
          return component.get('#entity-delete .btn-danger').trigger('click');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/projects/1/datasets/%C3%A1/entities/e'
        }]);
    });

    describe('after a successful response', () => {
      const del = () => {
        testData.extendedEntities.createPast(1, { label: 'My Entity' });
        return load('/projects/1/entity-lists/trees/entities')
          .complete()
          .request(async (component) => {
            await component.get('.entity-metadata-row .delete-button').trigger('click');
            return component.get('#entity-delete .btn-danger').trigger('click');
          })
          .respondWithSuccess();
      };

      it('hides the modal', async () => {
        const component = await del();
        component.getComponent(EntityDelete).props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await del();
        component.should.alert('success', 'Entity “My Entity” has been deleted.');
      });

      it('hides the row', async () => {
        const component = await del();
        const row = component.findComponent(EntityMetadataRow);
        row.exists().should.be.false;
      });

      it('updates the entity count', async () => {
        const component = await del();
        const text = component.get('#page-head-tabs li:nth-of-type(1)').text();
        text.should.equal('Entities 0');
      });
    });

    it('shows a success alert even when backend returns 404', async () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      const component = await load('/projects/1/entity-lists/trees/entities')
        .complete()
        .request(async (c) => {
          await c.get('.entity-metadata-row .delete-button').trigger('click');
          return c.get('#entity-delete .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1);

      component.should.alert('success', 'Entity “My Entity” has been deleted.');
    });

    describe('last entity was deleted', () => {
      beforeEach(() => {
        testData.extendedEntities.createPast(2);
      });

      const del = (index) => async (component) => {
        const row = component.get(`.entity-metadata-row:nth-child(${index + 1})`);
        await row.get('.delete-button').trigger('click');
        return component.get('#entity-delete .btn-danger').trigger('click');
      };

      it('hides the table', () =>
        load('/projects/1/entity-lists/trees/entities', { root: false, attachTo: document.body })
          .complete()
          .request(del(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#entity-table table').should.be.visible(true);
          })
          .request(del(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#entity-table table').should.be.hidden(true);
          }));

      it('shows a message', () =>
        load('/projects/1/entity-lists/trees/entities', { root: false })
          .complete()
          .request(del(1))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.hidden();
          })
          .request(del(0))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('.empty-table-message').should.be.visible();
          }));
    });
  });

  describe('restore', () => {
    const uuid = faker.string.uuid();
    const loadDeletedEntities = () => {
      testData.extendedEntities.createPast(1);
      testData.extendedEntities.createPast(1, {
        uuid,
        label: 'My Entity',
        deletedAt: new Date().toISOString()
      });
      return load(
        '/projects/1/entity-lists/trees/entities?deleted=true',
        { root: false, attachTo: document.body }
      );
    };

    it('toggles the modal', () => loadDeletedEntities()
      .complete()
      .testModalToggles({
        modal: EntityRestore,
        show: '.entity-metadata-row .restore-button',
        hide: '.btn-link'
      }));

    it('passes the entity to the modal', async () => {
      const component = await loadDeletedEntities();
      await component.get('.entity-metadata-row .restore-button').trigger('click');
      const { entity } = component.getComponent(EntityRestore).props();
      entity.label.should.equal('My Entity');
    });

    it('implements some standard button things', () => loadDeletedEntities()
      .afterResponses(component =>
        component.get('.entity-metadata-row .restore-button').trigger('click'))
      .testStandardButton({
        button: '#entity-restore .btn-danger',
        disabled: ['#entity-restore .btn-link'],
        modal: EntityRestore
      }));

    it('sends the correct request', () => loadDeletedEntities()
      .complete()
      .request(async (component) => {
        await component.get('.entity-metadata-row .restore-button').trigger('click');
        return component.get('#entity-restore .btn-danger').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: `/v1/projects/1/datasets/trees/entities/${uuid}/restore`
      }]));

    describe('after a successful response', () => {
      const restore = () => loadDeletedEntities()
        .complete()
        .request(async (component) => {
          await component.get('.entity-metadata-row .restore-button').trigger('click');
          return component.get('#entity-restore .btn-danger').trigger('click');
        })
        .respondWithSuccess();

      it('hides the modal', async () => {
        const component = await restore();
        component.getComponent(EntityRestore).props().state.should.be.false;
      });

      it('shows a success alert', async () => {
        const component = await restore();
        component.should.alert('success', 'Entity “My Entity” has been restored.');
      });

      it('hides the row', async () => {
        const component = await restore();
        const row = component.findComponent(EntityMetadataRow);
        row.exists().should.be.false;
      });

      it('updates the entity count', async () => {
        const component = await restore();
        const text = component.get('.toggle-deleted-entities').text();
        text.should.equal('0 deleted Entities');
      });
    });

    it('shows a success alert even when backend returns 404', async () => {
      const component = await loadDeletedEntities()
        .complete()
        .request(async (c) => {
          await c.get('.entity-metadata-row .restore-button').trigger('click');
          return c.get('#entity-restore .btn-danger').trigger('click');
        })
        .respondWithProblem(404.1);

      component.should.alert('success', 'Entity “My Entity” has been restored.');
    });

    describe('last entity was restore', () => {
      beforeEach(() => {
        testData.extendedEntities.createPast(1, {
          deletedAt: new Date().toISOString()
        });
      });

      const restore = (index) => async (component) => {
        const row = component.get(`.entity-metadata-row:nth-child(${index + 1})`);
        await row.get('.restore-button').trigger('click');
        return component.get('#entity-restore .btn-danger').trigger('click');
      };

      it('hides the table', () => loadDeletedEntities()
        .complete()
        .request(restore(1))
        .respondWithSuccess()
        .afterResponse(component => {
          component.get('#entity-table table').should.be.visible(true);
        })
        .request(restore(0))
        .respondWithSuccess()
        .afterResponse(component => {
          component.get('#entity-table table').should.be.hidden(true);
        }));

      it('shows a message', () => loadDeletedEntities()
        .complete()
        .request(restore(1))
        .respondWithSuccess()
        .afterResponse(component => {
          component.get('.empty-table-message').should.be.hidden();
        })
        .request(restore(0))
        .respondWithSuccess()
        .afterResponse(component => {
          component.get('.empty-table-message').should.be.visible();
        }));
    });

    it('continues to show modal if checkbox was not checked', () => {
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return loadDeletedEntities()
        .complete()
        .request(async (component) => {
          const row = component.get('.entity-metadata-row:last-child');
          await row.get('.restore-button').trigger('click');
          return component.get('#entity-restore .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .afterResponse(async (component) => {
          await component.get('.entity-metadata-row .restore-button').trigger('click');
          component.getComponent(EntityRestore).props().state.should.be.true;
        });
    });

    describe('deleting after checking the checkbox', () => {
      const restoreAndCheck = () => {
        testData.extendedEntities
          .createPast(1, { uuid: 'e1', label: 'Entity 1', deletedAt: new Date().toISOString() });
        return loadDeletedEntities()
          .complete()
          .request(async (component) => {
            const row = component.get('.entity-metadata-row:last-child');
            await row.get('.restore-button').trigger('click');
            const modal = component.getComponent(EntityRestore);
            await modal.get('input').setChecked();
            return modal.get('.btn-danger').trigger('click');
          })
          .respondWithSuccess()
          .complete();
      };

      it('immediately sends a request', () =>
        restoreAndCheck()
          .request(component =>
            component.get('.entity-metadata-row .restore-button').trigger('click'))
          .respondWithProblem()
          .testRequests([{
            method: 'POST',
            url: `/v1/projects/1/datasets/trees/entities/${uuid}/restore`
          }]));

      it('does not show the modal', () =>
        restoreAndCheck()
          .request(async (component) => {
            await component.get('.entity-metadata-row .restore-button').trigger('click');
            component.getComponent(EntityRestore).props().state.should.be.false;
          })
          .respondWithProblem());

      it('shows the correct alert', () =>
        restoreAndCheck()
          .request(component =>
            component.get('.entity-metadata-row .restore-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.should.alert('success', 'Entity “My Entity” has been restored.');
          }));

      // see the comment above in the similar test for delete Entity
      it('does not hide table after undeleting last entity if entities are concurrently replaced', () =>
        restoreAndCheck()
          .request(async (component) => {
            await component.get('#refresh-button').trigger('click');
            return component.get('.entity-metadata-row .restore-button').trigger('click');
          })
          .respondWithData(() => {
            testData.extendedEntities.splice(0);
            testData.extendedEntities.createNew({ deletedAt: new Date().toISOString() });
            testData.extendedEntities.createNew({ deletedAt: new Date().toISOString() });
            return testData.entityDeletedOData();
          })
          .respondWithSuccess()
          .afterResponses(component => {
            component.get('#entity-table').should.be.visible();
            component.find('[data-mark-rows-deleted]').exists().should.be.false;
          })
          .request(component =>
            component.get('.entity-metadata-row .restore-button').trigger('click'))
          .respondWithSuccess()
          .afterResponse(component => {
            component.get('#entity-table').should.be.visible();
          }));
    });
  });

  describe('pagination', () => {
    const checkIds = (component, count, offset = 0) => {
      const rows = component.findAllComponents(EntityDataRow);
      rows.length.should.equal(count);
      const entities = testData.extendedEntities.sorted();
      entities.length.should.be.at.least(count + offset);
      for (let i = 0; i < rows.length; i += 1) {
        const text = rows[i].get('td:last-child').text();
        text.should.equal(entities[i + offset].uuid);
      }
    };

    it('should load all entities if there are less than page size', async () => {
      createEntities(3);
      const component = await loadEntityList();
      checkIds(component, 3);
    });

    it('should load next page', async () => {
      createEntities(251);
      return loadEntityList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.entityOData(250, 250))
        .afterResponse(component => {
          checkIds(component, 1, 250);
        });
    });

    it('should load previous page', async () => {
      createEntities(251);
      return loadEntityList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.entityOData(250, 250))
        .complete()
        .request(component =>
          component.find('button[aria-label="Previous page"]').trigger('click'))
        .respondWithData(() => testData.entityOData(250))
        .afterResponse(async component => {
          checkIds(component, 250);
        });
    });

    it('should change the page size', async () => {
      createEntities(251);
      return loadEntityList()
        .complete()
        .request(component => {
          const sizeDropdown = component.find('.pagination select:has(option[value="500"])');
          return sizeDropdown.setValue(500);
        })
        .respondWithData(() => testData.entityOData(500))
        .afterResponse(async component => {
          checkIds(component, 251);
        });
    });

    it('should load first page on refresh', async () => {
      createEntities(251);
      return loadEntityList()
        .complete()
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.entityOData(250, 250))
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .respondWithData(() => testData.entityOData(250))
        .afterResponse(async component => {
          checkIds(component, 250);
        });
    });

    it('should show correct row number', () => {
      createEntities(251);
      return loadEntityList()
        .afterResponse(async component => {
          await nextTick();
          const rows = component.findAllComponents(EntityMetadataRow);
          rows[0].find('.row-number').text().should.be.eql('251');
          rows[249].find('.row-number').text().should.be.eql('2');
          rows.length.should.be.eql(250);
        })
        .request(component =>
          component.find('button[aria-label="Next page"]').trigger('click'))
        .respondWithData(() => testData.entityOData(250, 250))
        .afterResponse(component => {
          const rows = component.findAllComponents(EntityMetadataRow);
          rows[0].find('.row-number').text().should.be.eql('1');
        });
    });

    it('should load correct page on clicking next twice', () => {
      createEntities(501);
      return loadEntityList()
        .complete()
        .request(async component => {
          await component.find('button[aria-label="Next page"]').trigger('click');
          component.find('button[aria-label="Next page"]').trigger('click');
        })
        .respondWithData(() => testData.entityOData(250, 250))
        .respondWithData(() => testData.entityOData(250, 500))
        .afterResponses(async component => {
          checkIds(component, 1, 500);
          component.find('.pagination select').element.value.should.be.eql('2');
        });
    });
  });

  describe('deleted entities', () => {
    it('show deleted entities', () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      testData.extendedEntities.createPast(1, { label: 'deleted 1', deletedAt: new Date().toISOString() });
      testData.extendedEntities.createPast(1, { label: 'deleted 2', deletedAt: new Date().toISOString() });
      return loadEntityList({ props: { deleted: true } })
        .afterResponse(component => {
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(2);
          component.findAll('.table-freeze-scrolling tbody tr').forEach((r, i) => {
            r.find('td').text().should.be.equal(`deleted ${2 - i}`);
          });
        });
    });

    it('emits event to refresh deleted count when live entities are on display', () => {
      testData.extendedEntities.createPast(1);
      return loadEntityList()
        .complete()
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .respondWithData(testData.entityOData)
        .afterResponse(component => {
          component.emitted().should.have.property('fetch-deleted-count');
        });
    });

    it('updates the deleted count', () => {
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/truee/entities', { root: false, container: { router: testRouter() } })
        .complete()
        .request(component =>
          component.get('.toggle-deleted-entities').trigger('click'))
        .respondWithData(testData.entityDeletedOData)
        .afterResponses((component) => {
          component.find('.toggle-deleted-entities').text().should.equal('1 deleted Entity');
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(1);
        })
        .request(component =>
          component.get('#refresh-button').trigger('click'))
        .beforeAnyResponse(() => {
          testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
        })
        .respondWithData(testData.entityDeletedOData)
        .afterResponses((component) => {
          component.find('.toggle-deleted-entities').text().should.equal('2 deleted Entities');
          component.findAll('.table-freeze-scrolling tbody tr').length.should.be.equal(2);
        });
    });

    it('disables filters', () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      testData.extendedEntities.createPast(1, { label: 'deleted 1', deletedAt: new Date().toISOString() });
      testData.extendedEntities.createPast(1, { label: 'deleted 2', deletedAt: new Date().toISOString() });
      return loadEntityList({ props: { deleted: true } })
        .afterResponse(component => {
          component.getComponent('#entity-filters').props().disabled.should.be.true;
        });
    });

    it('disables download button', async () => {
      testData.extendedEntities.createPast(1, { label: 'My Entity' });
      testData.extendedEntities.createPast(1, { label: 'deleted 1', deletedAt: new Date().toISOString() });
      const app = await load(
        '/projects/1/entity-lists/trees/entities?deleted=true',
        { root: false, attachTo: document.body }
      );
      const button = app.getComponent('#entity-download-button');
      button.get('.btn-primary').classes().should.include('disabled');
      await button.should.have.tooltip('Download is unavailable for deleted Entities');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, { entities: 2 });
      testData.extendedEntities.createPast(2);
    });

    it('does not include search query parameter in the request by default', () =>
      load('/projects/1/entity-lists/trees/entities', { root: false })
        .beforeEachResponse((_, { url }, index) => {
          if (index !== 1) return;
          const search = relativeUrl(url).searchParams.get('$search');
          expect(search).to.be.null;
        }));

    it('should set the query parameter in the URL', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request((c) => {
          c.find('.search-textbox').setValue('some text');
          return c.find('.search-textbox').trigger('keydown', { key: 'enter' });
        })
        .respondWithData(testData.entityOData)
        .afterResponse(app => {
          app.vm.$route.query.search.should.equal('some text');
        }));

    it('should read searched text from the URL', () =>
      load('/projects/1/entity-lists/trees/entities?search=john', { root: false })
        .testRequestsInclude([{
          url: ({ searchParams }) => {
            searchParams.get('$search').should.be.equal('john');
          }
        }]));

    it('should re-renders the table after enter is pressed', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .afterResponses(app => {
          app.findComponent(EntityMetadataRow).exists().should.be.true;
        })
        .request((c) => {
          c.find('.search-textbox').setValue('some text');
          return c.find('.search-textbox').trigger('keydown', { key: 'enter' });
        })
        .beforeEachResponse((app, { url }) => {
          app.findComponent(EntityMetadataRow).exists().should.be.false;
          relativeUrl(url).searchParams.has('$search').should.be.true;
        })
        .respondWithData(testData.entityOData)
        .afterResponse(app => {
          app.findComponent(EntityMetadataRow).exists().should.be.true;
        });
    });

    it('should clear search textbox and reset table when clear(x) button is pressed', () => {
      testData.extendedEntities.createPast(1);
      return load('/projects/1/entity-lists/trees/entities?search=john', {
        attachTo: document.body
      })
        .afterResponses(app => {
          app.findComponent(EntityMetadataRow).exists().should.be.true;
          app.get('.search-textbox').element.value.should.be.eql('john');
        })
        .request((c) => c.find('.search-textbox ~ .close').trigger('click'))
        .beforeEachResponse((app, { url }) => {
          app.findComponent(EntityMetadataRow).exists().should.be.false;
          relativeUrl(url).searchParams.has('$search').should.be.false;
        })
        .respondWithData(testData.entityOData)
        .afterResponse(app => {
          app.findComponent(EntityMetadataRow).exists().should.be.true;
          app.get('.search-textbox').element.value.should.be.eql('');
        });
    });

    it('should not update entities count in the dataset resource', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .afterResponses(app => {
          app.vm.$container.requestData.dataset.entities.should.equal(2);
        })
        .request((c) => {
          c.find('.search-textbox').setValue('some text');
          return c.find('.search-textbox').trigger('keydown', { key: 'enter' });
        })
        .respondWithData(() => ({
          ...testData.entityOData(1),
          '@odata.count': 1,
          '@odata.nextLink': undefined
        }))
        .afterResponse(app => {
          app.vm.$container.requestData.dataset.entities.should.equal(2);
        }));

    it('should re-renders the table after search term is changed via URL', () =>
      load('/projects/1/entity-lists/trees/entities')
        .complete()
        .route('/projects/1/entity-lists/trees/entities?search=john')
        .beforeEachResponse((_, { url }) => {
          relativeUrl(url).searchParams.get('$search').should.be.equal('john');
        })
        .respondWithData(testData.entityOData)
        .afterResponse(app => {
          app.get('.search-textbox').element.value.should.be.equal('john');
        }));
  });

  describe('bulk delete functionality', () => {
    beforeEach(() => {
      createEntities(3);
    });

    it('does not show checkboxes for project viewers', () => {
      testData.reset();
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      testData.extendedEntities.createPast(2);

      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .afterResponses(component => {
          component.find('#entity-table th input[type="checkbox"]').exists().should.be.false;

          component.findAll('.entity-metadata-row input[type="checkbox"]').length.should.equal(0);
        });
    });

    it('shows action bar when entities are selected', async () => {
      const component = await loadEntityList();
      const actionBar = component.findComponent({ name: 'ActionBar' });
      actionBar.props().state.should.be.false;

      const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
      await checkboxes[0].setValue(true);
      await checkboxes[1].setValue(true);

      actionBar.props().state.should.be.true;
      actionBar.props().message.should.equal('2 Entities selected');
    });

    it('hides action bar when all entities are deselected', async () => {
      const component = await loadEntityList();
      const actionBar = component.findComponent({ name: 'ActionBar' });

      // Click on checkboxes to select entities first
      const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
      await checkboxes[0].setValue(true);
      await checkboxes[1].setValue(true);

      actionBar.props().state.should.be.true;

      await checkboxes[0].setValue(false);
      await checkboxes[1].setValue(false);

      actionBar.props().state.should.be.false;
    });

    it('handles select all functionality', async () => {
      const component = await loadEntityList();
      const actionBar = component.findComponent({ name: 'ActionBar' });

      actionBar.props().state.should.be.false;

      // Click the header "select all" checkbox
      const headerCheckbox = component.find('#entity-table input[type="checkbox"]');
      const rowCheckboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');

      await headerCheckbox.setValue(true);

      actionBar.props().state.should.be.true;
      actionBar.props().message.should.equal('3 Entities selected');

      rowCheckboxes.forEach(checkbox => {
        checkbox.element.checked.should.be.true;
      });

      // unselect all
      await headerCheckbox.setValue(false);
      actionBar.props().state.should.be.false;
      rowCheckboxes.forEach(checkbox => {
        checkbox.element.checked.should.be.false;
      });
    });

    it('handles bulk delete request successfully', () => load('/projects/1/entity-lists/trees/entities')
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .beforeEachResponse((_, { url, data }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-delete');
        const entities = testData.extendedEntities.sorted();
        const expectedUUIDs = [entities[0].uuid, entities[1].uuid];
        data.ids.should.eql(expectedUUIDs);
      })
      .respondWithSuccess()
      .afterResponse(component => {
        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.false;

        const remainingRows = component.findAllComponents(EntityMetadataRow);
        remainingRows.length.should.equal(1);

        const deletedEntitiesButton = component.find('.toggle-deleted-entities');
        deletedEntitiesButton.text().should.equal('2 deleted Entities');
      }));

    it('shows alert on failure of bulk delete request', () => loadEntityList()
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .beforeEachResponse((_, { url }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-delete');
      })
      .respondWithProblem(500.1)
      .afterResponse(component => {
        component.should.alert('danger');
      }));

    it('handles try again button when bulk delete fails', () => load('/projects/1/entity-lists/trees/entities')
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .respondWithProblem(500.1)
      .complete()
      .request(component => {
        const tryAgainButton = component.find('.alert .btn');
        return tryAgainButton.trigger('click');
      })
      .beforeEachResponse((_, { url, data }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-delete');
        const entities = testData.extendedEntities.sorted();
        const expectedUUIDs = [entities[0].uuid, entities[1].uuid];
        data.ids.should.eql(expectedUUIDs);
      })
      .respondWithSuccess()
      .afterResponse(component => {
        const remainingRows = component.findAllComponents(EntityMetadataRow);
        remainingRows.length.should.equal(1);
        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.false;
      }));

    it('should undo the bulk delete', () => load('/projects/1/entity-lists/trees/entities')
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .respondWithSuccess()
      .complete()
      .request(component => {
        const undoButton = component.find('.alert .btn');
        return undoButton.trigger('click');
      })
      .beforeEachResponse((_, { url }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-restore');
      })
      .respondWithSuccess()
      .afterResponse(component => {
        const remainingRows = component.findAllComponents(EntityMetadataRow);
        remainingRows.length.should.equal(3);
        const deletedEntitiesButton = component.find('.toggle-deleted-entities');
        deletedEntitiesButton.exists().should.be.false;
      }));

    it('shows alert when bulk restore fails and doesnt show action bar on hiding the alert', () => loadEntityList()
      .complete()
      .request(async component => {
        // First perform bulk delete to have entities to restore
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .respondWithSuccess()
      .complete()
      .request(component => component.vm.$container.alert.cta.handler())
      .beforeEachResponse((_, { url }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-restore');
      })
      .respondWithProblem(500.1)
      .afterResponse(component => {
        component.should.alert('danger');
        component.vm.alert.last.hide();
        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.false;
      }));

    it('handles try again button when bulk restore fails', () => load('/projects/1/entity-lists/trees/entities')
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .respondWithSuccess()
      .complete()
      .request(component => {
        const undoButton = component.find('.alert .btn');
        return undoButton.trigger('click');
      })
      .respondWithProblem(500.1)
      .complete()
      .request(component => {
        const tryAgainButton = component.find('.alert .btn');
        return tryAgainButton.trigger('click');
      })
      .beforeEachResponse((_, { url, data }) => {
        url.should.equal('/v1/projects/1/datasets/trees/entities/bulk-restore');
        const entities = testData.extendedEntities.sorted();
        const expectedUUIDs = [entities[0].uuid, entities[1].uuid];
        data.ids.should.eql(expectedUUIDs);
      })
      .respondWithSuccess()
      .afterResponse(component => {
        const remainingRows = component.findAllComponents(EntityMetadataRow);
        remainingRows.length.should.equal(3); // All 3 entities should be back
        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.false;
      }));

    it('disables the other controls during bulk delete operation', () => {
      testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/entity-lists/trees/entities', { attachTo: document.body })
        .complete()
        .request(async component => {
          const disableContainer = component.getComponent({ name: 'DisableContainer' });
          disableContainer.props().disabled.should.be.false;

          const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
          await checkboxes[0].setValue(true);
          await checkboxes[1].setValue(true);
          return component.find('.action-bar-container .btn-primary').trigger('click');
        })
        .beforeEachResponse(component => {
          const disableContainer = component.getComponent({ name: 'DisableContainer' });
          disableContainer.props().disabled.should.be.true;
          disableContainer.props().disabledMessage.should.equal('Bulk operation in progress');

          // Assert that filters, table, pagination controls are in the disabled container
          disableContainer.find('#entity-list-actions').exists().should.be.true;
          disableContainer.find('#entity-table').exists().should.be.true;
          disableContainer.find('.pagination').exists().should.be.true;
          disableContainer.find('#refresh-button').exists().should.be.true;

          // Assert "Deleted Entities" button is hidden
          component.find('.toggle-deleted-entities').should.be.hidden(true);
        })
        .respondWithSuccess()
        .afterResponse(component => {
          const disableContainer = component.getComponent({ name: 'DisableContainer' });
          disableContainer.props().disabled.should.be.false;
        });
    });

    it('hides alert when entities are selected', async () => {
      const component = await loadEntityList();

      // Show an alert first
      component.vm.alert.info('Some alert message');
      component.vm.alert.state.should.be.true;

      // Select an entity by clicking its checkbox - this should hide the alert
      const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
      await checkboxes[0].setValue(true);

      component.vm.alert.state.should.be.false;
    });

    it('removes entity from selection when individually deleted', () => loadEntityList()
      .complete()
      .request(async component => {
        const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
        await checkboxes[0].setValue(true);
        await checkboxes[1].setValue(true);

        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.true;
        actionBar.props().message.should.equal('2 Entities selected');

        await component.get('.entity-metadata-row:first-child .delete-button').trigger('click');
        return component.get('#entity-delete .btn-danger').trigger('click');
      })
      .respondWithSuccess()
      .afterResponse(async component => {
        const actionBar = component.findComponent({ name: 'ActionBar' });
        actionBar.props().state.should.be.true;
        actionBar.props().message.should.equal('1 Entity selected');
      }));

    it('clears selected entities when action bar close button is pressed', async () => {
      const component = await loadEntityList();

      const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
      await checkboxes[0].setValue(true);
      await checkboxes[1].setValue(true);

      const actionBar = component.findComponent({ name: 'ActionBar' });
      actionBar.props().state.should.be.true;
      actionBar.props().message.should.equal('2 Entities selected');

      await actionBar.find('.close').trigger('click');

      actionBar.props().state.should.be.false;
      checkboxes[0].element.checked.should.be.false;
      checkboxes[1].element.checked.should.be.false;
    });

    it('clears selected entities when refresh completes', async () => {
      const component = await loadEntityList()
        .complete()
        .request(async c => {
          const checkboxes = c.findAll('.entity-metadata-row input[type="checkbox"]');
          await checkboxes[0].setValue(true);
          await checkboxes[1].setValue(true);

          checkboxes[0].element.checked.should.be.true;
          checkboxes[1].element.checked.should.be.true;

          const actionBar = c.findComponent({ name: 'ActionBar' });
          actionBar.props().state.should.be.true;
          return c.get('#refresh-button').trigger('click');
        })
        .respondWithData(testData.entityOData)
        .complete();

      const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
      checkboxes[0].element.checked.should.be.false;
      checkboxes[1].element.checked.should.be.false;

      const actionBar = component.findComponent({ name: 'ActionBar' });
      actionBar.props().state.should.be.false;
    });

    it('aborts refresh request when bulk delete is initiated during refresh', () =>
      loadEntityList()
        .complete()
        .request(async component => {
          sinon.spy(component.vm.$container.requestData.localResources.odataEntities, 'cancelRequest');
          component.get('#refresh-button').trigger('click');
          const checkboxes = component.findAll('.entity-metadata-row input[type="checkbox"]');
          await checkboxes[0].setValue(true);
          await checkboxes[1].setValue(true);
          return component.find('.action-bar-container .btn-primary').trigger('click');
        })
        .respondWithData(testData.entityOData)
        .respondWithSuccess()
        .afterResponses((component) => {
          component.vm.$container.requestData.localResources.odataEntities.cancelRequest.called.should.be.true;
        }));
  });

  it('sets allSelected to false when all entities on current page are deleted and user navigates to next page', () => {
    createEntities(251);
    return loadEntityList()
      .complete()
      .request(async component => {
        const headerCheckbox = component.find('#entity-table input[type="checkbox"]');
        await headerCheckbox.setValue(true);
        return component.find('.action-bar-container .btn-primary').trigger('click');
      })
      .respondWithSuccess()
      .complete()
      .request(component => component.find('button[aria-label="Next page"]').trigger('click'))
      .respondWithData(() => testData.entityOData(1, 250))
      .afterResponse(component => {
        const headerCheckbox = component.find('#entity-table input[type="checkbox"]');
        headerCheckbox.element.checked.should.be.false;
      });
  });

  it('preserves select all checkbox state when edit modal is cancelled', async () => {
    createEntities(3);
    const component = await loadEntityList();

    const headerCheckbox = component.find('#entity-table input[type="checkbox"]');
    await headerCheckbox.setValue(true);
    headerCheckbox.element.checked.should.be.true;

    await component.get('.entity-metadata-row:first-child .update-button').trigger('click');

    await component.get('#entity-update .btn-link').trigger('click');

    headerCheckbox.element.checked.should.be.true;
  });

  it('unchecks select all checkbox when action bar close button is pressed', async () => {
    createEntities(3);
    const component = await loadEntityList();

    const headerCheckbox = component.find('#entity-table input[type="checkbox"]');
    await headerCheckbox.setValue(true);
    headerCheckbox.element.checked.should.be.true;

    const actionBar = component.findComponent({ name: 'ActionBar' });
    await actionBar.find('.close').trigger('click');

    headerCheckbox.element.checked.should.be.false;
  });
});
