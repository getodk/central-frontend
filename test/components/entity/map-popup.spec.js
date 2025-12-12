import DateTime from '../../../src/components/date-time.vue';
import DlData from '../../../src/components/dl-data.vue';
import EntityDelete from '../../../src/components/entity/delete.vue';
import EntityMapPopup from '../../../src/components/entity/map-popup.vue';
import EntityResolve from '../../../src/components/entity/resolve.vue';
import EntityUpdate from '../../../src/components/entity/update.vue';
import GeojsonMap from '../../../src/components/geojson-map.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const mountOptions = (options = undefined) => {
  const project = testData.extendedProjects.last();
  const projectId = project.id.toString();
  const dataset = testData.extendedDatasets.last();
  const encodedDataset = encodeURIComponent(dataset.name);
  return mergeMountOptions(options, {
    global: {
      provide: { projectId, datasetName: dataset.name }
    },
    container: {
      router: mockRouter(`/projects/${projectId}/entity-lists/${encodedDataset}/entities?map=true`),
      requestData: { project, dataset }
    }
  });
};
const requestEntity = (series) => series
  .request(component => component.setProps({
    uuid: testData.extendedEntities.last().uuid
  }))
  .respondWithData(() => testData.entityOData(1));

describe('EntityMapPopup', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Allison' });
    testData.extendedDatasets.createPast(1, {
      name: 'á',
      properties: [
        { name: 'height' },
        { name: 'circumference.cm', odataName: 'circumference_cm' },
        { name: 'geometry' },
        { name: 'one_more' }
      ],
      entities: 1
    });
    testData.extendedEntities.createPast(1, {
      uuid: 'e',
      label: 'Dogwood',
      data: {
        height: '1',
        'circumference.cm': '2',
        geometry: 'POINT (3 3)',
        one_more: null
      }
    });
  });

  it('does nothing if uuid is not defined', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .testNoRequest()
      .afterResponses(component => {
        component.should.be.hidden();
      }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .testRequests([{
        url: ({ pathname, searchParams }) => {
          pathname.should.equal('/v1/projects/1/datasets/%C3%A1.svc/Entities');
          searchParams.get('$filter').should.equal("__id eq 'e'");
        }
      }]));

  describe('unexpected responses', () => {
    it('handles an error response', () =>
      mockHttp()
        .mount(EntityMapPopup, mountOptions())
        .request(component => component.setProps({ uuid: 'e' }))
        .respondWithProblem({ code: 500.1, message: 'Oh no' })
        .afterResponse(component => {
          component.should.redAlert('Oh no');
          component.emitted().hide.should.eql([[]]);
        }));

    it('handles empty OData', () =>
      mockHttp()
        .mount(EntityMapPopup, mountOptions())
        .modify(requestEntity)
        .beforeAnyResponse(() => {
          testData.extendedEntities.splice(0);
        })
        .afterResponse(component => {
          component.should.redAlert(message => {
            message.should.startWith('The resource you are looking for cannot be found.');
          });
          component.emitted().hide.should.eql([[]]);
        }));
  });

  it('shows the entity label in the title', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        const span = component.get('#entity-map-popup .map-popup-title span');
        span.text().should.equal('Dogwood');
        await span.should.have.textTooltip();
      }));

  it('shows entity metadata', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        const dd = component.findAll('dd');
        dd.length.should.be.above(2);

        dd[0].text().should.equal('Allison');
        await dd[0].should.have.textTooltip();

        const { createdAt } = testData.extendedEntities.last();
        dd[1].getComponent(DateTime).props().iso.should.equal(createdAt);
      }));

  it('shows property data', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(async (component) => {
        // Pairs of <dt> and <dd> elements
        const pairs = component.findAllComponents(DlData);
        pairs.map(pair => [pair.props().name, pair.props().value]).should.eql([
          ['height', '1'],
          // The actual property name is shown, not the property's OData name.
          ['circumference.cm', '2'],
          ['geometry', 'POINT (3 3)'],
          ['one_more', null]
        ]);
      }));

  it('updates after the uuid changes', () =>
    mockHttp()
      .mount(EntityMapPopup, mountOptions())
      .modify(requestEntity)
      .afterResponse(() => {
        testData.extendedEntities.createNew({
          uuid: 'e2',
          label: 'Elm',
          data: { geometry: 'POINT (4 4)' }
        });
      })
      .modify(requestEntity)
      .testRequests([{
        url: ({ searchParams }) => {
          searchParams.get('$filter').should.equal("__id eq 'e2'");
        }
      }])
      .afterResponse(component => {
        component.get('#entity-map-popup .map-popup-title').text().should.equal('Elm');
        const { value } = component.findAllComponents(DlData)[2].props();
        value.should.equal('POINT (4 4)');
      }));

  describe('update button', () => {
    const update = (confirm = true) => load('/projects/1/entity-lists/%C3%A1/entities?map=true')
      .complete()
      .request(app => {
        app.getComponent(GeojsonMap).vm.selectFeature('e');
      })
      .respondWithData(testData.entityOData)
      .afterResponse(app =>
        app.get('#entity-map-popup .update-button').trigger('click'))
      .modify(series => (!confirm
        ? series
        : series
          .request(async (app) => {
            const modal = app.getComponent(EntityUpdate);
            await modal.get('textarea').setValue('Updated Entity');
            return modal.get('form').trigger('submit');
          })
          .respondWithData(() => {
            testData.extendedEntityVersions.createNew({
              label: 'Updated Entity'
            });
            return testData.standardEntities.last();
          })));

    it('shows the modal', async () => {
      const app = await update(false);
      app.getComponent(EntityUpdate).props().state.should.be.true;
    });

    it('sends the correct request', () =>
      update().testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/datasets/%C3%A1/entities/e?baseVersion=1',
        data: { label: 'Updated Entity', data: Object.create(null) }
      }]));

    it('updates the label', async () => {
      const app = await update();
      const text = app.get('#entity-map-popup .map-popup-title').text();
      text.should.equal('Updated Entity');
    });
  });

  describe('resolve button', () => {
    beforeEach(() => {
      // Create a conflict.
      testData.extendedEntityVersions
        .createPast(1, { height: '2' })
        .createPast(1, { label: 'Elm', baseVersion: 1 });
    });

    const relevantToConflict = () => testData.extendedEntityVersions.sorted()
      .filter(version => version.relevantToConflict);
    const showResolve = () => load('/projects/1/entity-lists/%C3%A1/entities?map=true')
      .complete()
      .request(app => {
        app.getComponent(GeojsonMap).vm.selectFeature('e');
      })
      .respondWithData(testData.entityOData)
      .complete()
      .request(app =>
        app.get('#entity-map-popup .resolve-button').trigger('click'))
      .respondWithData(relevantToConflict)
      .complete();

    it('shows the modal', async () => {
      const app = await showResolve(false);
      app.getComponent(EntityResolve).props().state.should.be.true;
    });

    describe('marking as resolved', () => {
      const resolve = (series) => series
        .request(app =>
          app.get('#entity-resolve .mark-as-resolved').trigger('click'))
        .respondWithData(() => {
          testData.extendedEntities.resolve(-1);
          return testData.standardEntities.last();
        });

      it('sends the correct request', () =>
        showResolve()
          .modify(resolve)
          .testRequests([{
            method: 'PATCH',
            url: '/v1/projects/1/datasets/%C3%A1/entities/e?resolve=true&baseVersion=3'
          }]));

      it('hides the button in the popup', async () =>
        showResolve()
          .modify(resolve)
          .afterResponse(app => {
            app.find('#entity-map-popup .resolve-button').exists().should.be.false;
          }));
    });

    describe('updating data', () => {
      const update = () => showResolve()
        .request(async (app) => {
          await app.get('#entity-resolve .edit-entity').trigger('click');
          const modal = app.getComponent(EntityUpdate);
          await modal.get('textarea').setValue('Updated Entity');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => {
          testData.extendedEntityVersions.createNew({
            label: 'Updated Entity'
          });
          return testData.standardEntities.last();
        })
        .respondWithData(relevantToConflict);

      it('requests new data for the conflict table', () =>
        update().testRequestsInclude([{
          url: '/v1/projects/1/datasets/%C3%A1/entities/e/versions?relevantToConflict=true',
          extended: true
        }]));

      it('updates the label in the resolve modal', async () => {
        const app = await update();
        const modal = app.getComponent(EntityResolve);
        modal.props().state.should.be.true;
        modal.get('.modal-title').text().should.include('Updated Entity');
      });

      it('updates the label in the update modal', async () => {
        const app = await update();
        await app.get('#entity-resolve .edit-entity').trigger('click');
        const modal = app.getComponent(EntityUpdate);
        modal.props().state.should.be.true;
        modal.get('.modal-title').text().should.equal('Update Updated Entity');
      });

      it('updates the label in the popup', async () => {
        const app = await update();
        await app.get('#entity-resolve .close').trigger('click');
        const text = app.get('#entity-map-popup .map-popup-title').text();
        text.should.equal('Updated Entity');
      });
    });
  });

  describe('delete button', () => {
    const del = (confirm = true) => load('/projects/1/entity-lists/%C3%A1/entities?map=true')
      .complete()
      .request(app => {
        app.getComponent(GeojsonMap).vm.selectFeature('e');
      })
      .respondWithData(testData.entityOData)
      .afterResponse(app =>
        app.get('#entity-map-popup .delete-button').trigger('click'))
      .modify(series => (!confirm
        ? series
        : series
          .request(app => app.get('#entity-delete .btn-danger').trigger('click'))
          .respondWithSuccess()));

    it('shows the modal', async () => {
      const app = await del(false);
      app.getComponent(EntityDelete).props().state.should.be.true;
    });

    it('sends the correct request', () =>
      del().testRequests([{
        method: 'DELETE',
        url: '/v1/projects/1/datasets/%C3%A1/entities/e'
      }]));

    it('removes the feature from the map', () =>
      del()
        .beforeAnyResponse(app => {
          app.getComponent(GeojsonMap).vm.getFeatures().length.should.equal(1);
        })
        .afterResponse(app => {
          app.getComponent(GeojsonMap).vm.getFeatures().length.should.equal(0);
          app.get('#entity-list .empty-table-message').should.be.visible();
        }));

    it('hides the popup', async () => {
      const app = await del();
      app.getComponent(EntityMapPopup).should.be.hidden();
    });
  });
});
