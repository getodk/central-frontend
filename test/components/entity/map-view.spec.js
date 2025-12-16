import GeojsonMap from '../../../src/components/geojson-map.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { findTab } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';

const findToggle = (component) => component.find('#entity-list .radio-field');
const toggleView = (view) => (app) =>
  findToggle(app).get(`input[type="radio"][value="${view}"]`).setChecked();
const getView = (app) => {
  const hasTable = app.find('#entity-table').exists();
  const hasMap = app.find('#map-view').exists();
  if (hasTable && hasMap) throw new Error('both views are rendered');
  if (!hasTable && !hasMap) throw new Error('neither view is rendered');
  return hasTable ? 'table' : 'map';
};
const countFeatures = (app) => {
  const { data } = app.getComponent(GeojsonMap).props();
  return data != null ? data.features.length : 0;
};

describe('EntityMapView', () => {
  beforeEach(mockLogin);

  describe('toggle', () => {
    it('shows the toggle if the dataset has a geometry property', async () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'geometry' }]
      });
      const app = await load('/projects/1/entity-lists/trees/entities');
      findToggle(app).exists().should.be.true;
    });

    it('does not show toggle if dataset does not have geometry property', async () => {
      testData.extendedDatasets.createPast(1);
      const app = await load('/projects/1/entity-lists/trees/entities');
      findToggle(app).exists().should.be.false;
    });

    it('switches to map view', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'á',
        properties: [{ name: 'geometry' }]
      });
      return load('/projects/1/entity-lists/%C3%A1/entities')
        .complete()
        .request(toggleView('map'))
        .respondWithData(testData.entityGeojson)
        .testRequests([{ url: '/v1/projects/1/datasets/%C3%A1/entities.geojson' }])
        .afterResponses(app => {
          getView(app).should.equal('map');
          expect(app.vm.$route.query.map).to.equal('true');
        });
    });

    it('switches back to table view', () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'geometry' }]
      });
      return load('/projects/1/entity-lists/trees/entities')
        .complete()
        .request(toggleView('map'))
        .respondWithData(testData.entityGeojson)
        .complete()
        .request(toggleView('table'))
        .respondWithData(testData.entityOData)
        .testRequests([{
          url: ({ pathname }) => {
            pathname.should.equal('/v1/projects/1/datasets/trees.svc/Entities');
          }
        }])
        .afterResponses(app => {
          getView(app).should.equal('table');
          should.not.exist(app.vm.$route.query.map);
        });
    });
  });

  describe('filters and search', () => {
    it('passes filters and search through to the request', () => {
      setLuxon({ defaultZoneName: 'UTC' });
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'geometry' }]
      });
      return load('/projects/1/entity-lists/trees/entities?map=true&creatorId=1&creatorId=2&start=1970-01-01&end=1970-01-02&conflict=true&search=foo')
        .testRequestsInclude([{
          url: ({ pathname, searchParams }) => {
            pathname.should.equal('/v1/projects/1/datasets/trees/entities.geojson');
            searchParams.getAll('creatorId').should.eql(['1', '2']);
            searchParams.get('start__gte').should.equal('1970-01-01T00:00:00.000Z');
            searchParams.get('end__lte').should.equal('1970-01-02T23:59:59.999Z');
            searchParams.getAll('conflict').should.eql(['soft', 'hard']);
            searchParams.get('$search').should.equal('foo');
          }
        }]);
    });

    it('refreshes the map after a filter changes', () => {
      testData.extendedEntities.createPast(1, {
        data: { geometry: 'POINT (1 2)' }
      });
      return load('/projects/1/entity-lists/trees/entities?map=true', { attachTo: document.body })
        .afterResponses(app => {
          countFeatures(app).should.equal(1);
        })
        .request(changeMultiselect('#entity-filters-conflict', [1]))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/datasets/trees/entities.geojson?conflict=null');
          // Not a background refresh: the map disappears during the request.
          countFeatures(app).should.equal(0);
        })
        .respondWithData(testData.entityGeojson)
        .afterResponse(app => {
          countFeatures(app).should.equal(1);
        });
    });

    it('refreshes the map after the search term changes', () => {
      testData.extendedEntities.createPast(1, {
        data: { geometry: 'POINT (1 2)' }
      });
      return load('/projects/1/entity-lists/trees/entities?map=true', { attachTo: document.body })
        .afterResponses(app => {
          countFeatures(app).should.equal(1);
        })
        .request(async (app) => {
          const search = app.get('.search-textbox');
          await search.setValue('foo');
          return search.trigger('keydown', { key: 'enter' });
        })
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/datasets/trees/entities.geojson?%24search=foo');
          countFeatures(app).should.equal(0);
        })
        .respondWithData(testData.entityGeojson)
        .afterResponse(app => {
          countFeatures(app).should.equal(1);
        });
    });
  });

  describe('after the Refresh button is clicked', () => {
    it('sends the correct requests', () => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'geometry' }]
      });
      return load('/projects/1/entity-lists/trees/entities?map=true')
        .complete()
        .request(app =>
          app.get('#refresh-button').trigger('click'))
        .respondWithData(testData.entityGeojson)
        .respondWithData(() => testData.entityDeletedOData(0))
        .testRequests([
          { url: '/v1/projects/1/datasets/trees/entities.geojson' },
          {
            // deletedEntityCount
            url: ({ pathname, searchParams }) => {
              pathname.should.equal('/v1/projects/1/datasets/trees.svc/Entities');
              searchParams.get('$filter').should.equal('__system/deletedAt ne null');
              searchParams.get('$top').should.equal('0');
            }
          }
        ]);
    });

    it('updates the map', () => {
      testData.extendedEntities.createPast(1, {
        data: { geometry: 'POINT (1 2)' }
      });
      return load('/projects/1/entity-lists/trees/entities?map=true')
        .afterResponses(app => {
          countFeatures(app).should.equal(1);
        })
        .request(app =>
          app.get('#refresh-button').trigger('click'))
        .beforeEachResponse((app, _, i) => {
          if (i === 0) countFeatures(app).should.equal(1);
        })
        .respondWithData(() => {
          testData.extendedEntities.createNew({
            data: { geometry: 'POINT (3 4)' }
          });
          return testData.entityGeojson();
        })
        .respondWithData(() => testData.entityDeletedOData(0))
        .afterResponses(app => {
          countFeatures(app).should.equal(2);
        });
    });
  });

  describe('empty message', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1, {
        properties: [{ name: 'geometry' }]
      });
    });

    it('shows a message if no entities are returned', async () => {
      const app = await load('/projects/1/entity-lists/trees/entities?map=true');
      const message = app.get('.empty-table-message');
      message.should.be.visible();
      const text = message.text();
      text.should.equal('No map data available yet. Entities only appear if they include data in the geometry property.');
      countFeatures(app).should.equal(0);
    });

    it('shows a different message if a filter is applied', async () => {
      const app = await load('/projects/1/entity-lists/trees?map=true&conflict=true');
      const message = app.get('.empty-table-message');
      message.should.be.visible();
      message.text().should.equal('There are no matching Entities.');
      countFeatures(app).should.equal(0);
    });
  });

  it('does not update the tab badge', async () => {
    testData.extendedDatasets.createPast(1, {
      properties: [{ name: 'geometry' }],
      entities: 2
    });
    testData.extendedEntities
      .createPast(1, { data: { geometry: 'POINT (1 2)' } })
      .createPast(1);
    const app = await load('/projects/1/entity-lists/trees/entities?map=true');
    countFeatures(app).should.equal(1);
    // Even though there is only one entity in the GeoJSON, that should not
    // change the entity count in the tab badge.
    findTab(app, 'Entities').get('.badge').text().should.equal('2');
  });
});
