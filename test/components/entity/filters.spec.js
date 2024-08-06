import EntityFiltersConflict from '../../../src/components/entity/filters/conflict.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';

describe('EntityFilters', () => {
  beforeEach(mockLogin);

  describe('conflict filter', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    describe('initial request', () => {
      it('does not filter by default', () =>
        load('/projects/1/entity-lists/trees/entities', { root: false })
          .beforeEachResponse((_, { url }) => {
            if (!url.includes('.svc')) return;
            relativeUrl(url).searchParams.has('$filter').should.be.false;
          }));

      it('sends the correct request for ?conflict=true', () =>
        load('/projects/1/entity-lists/trees/entities?conflict=true', { root: false })
          .beforeEachResponse((_, { url }) => {
            if (!url.includes('.svc')) return;
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/conflict ne null');
          }));

      it('sends the correct request for ?conflict=false', () =>
        load('/projects/1/entity-lists/trees/entities?conflict=false', { root: false })
          .beforeEachResponse((_, { url }) => {
            if (!url.includes('.svc')) return;
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/conflict eq null');
          }));
    });

    describe('initial filter selection', () => {
      it('selects all options by default', async () => {
        const component = await load('/projects/1/entity-lists/trees/entities', {
          root: false
        });
        const { modelValue } = component.getComponent(EntityFiltersConflict).props();
        modelValue.should.eql([true, false]);
      });

      it('selects the correct option for ?conflict=true', async () => {
        const component = await load('/projects/1/entity-lists/trees/entities?conflict=true', {
          root: false
        });
        const { modelValue } = component.getComponent(EntityFiltersConflict).props();
        modelValue.should.eql([true]);
      });

      it('selects the correct option for ?conflict=false', async () => {
        const component = await load('/projects/1/entity-lists/trees/entities?conflict=false', {
          root: false
        });
        const { modelValue } = component.getComponent(EntityFiltersConflict).props();
        modelValue.should.eql([false]);
      });
    });

    describe('invalid query parameters', () => {
      const cases = [
        'conflict=foo',
        'conflict',
        'conflict=true&conflict=true',
        'conflict=true&conflict=false'
      ];
      for (const query of cases) {
        it(`falls back to the default for ?${query}`, () =>
          load(`/projects/1/entity-lists/trees/entities?${query}`, { root: false })
            .beforeEachResponse((_, { url }) => {
              if (!url.includes('.svc')) return;
              relativeUrl(url).searchParams.has('$filter').should.be.false;
            }));
      }
    });

    describe('after the filter selection is changed', () => {
      it('sends a request', () =>
        load('/projects/1/entity-lists/trees/entities', {
          attachTo: document.body
        })
          .complete()
          .request(changeMultiselect('#entity-filters-conflict', [0]))
          .beforeEachResponse((_, { url }) => {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/conflict ne null');
          })
          .respondWithData(testData.entityOData));

      it('re-renders the table', () => {
        testData.extendedEntities.createPast(1);
        return load('/projects/1/entity-lists/trees/entities', {
          attachTo: document.body
        })
          .afterResponses(app => {
            app.findComponent(EntityMetadataRow).exists().should.be.true;
          })
          .request(changeMultiselect('#entity-filters-conflict', [1]))
          .beforeEachResponse((app, { url }) => {
            app.findComponent(EntityMetadataRow).exists().should.be.false;
            relativeUrl(url).searchParams.has('$skiptoken').should.be.false;
          })
          .respondWithData(testData.entityOData)
          .afterResponse(app => {
            app.findComponent(EntityMetadataRow).exists().should.be.true;
          });
      });

      it('updates the query parameter', () =>
        load('/projects/1/entity-lists/trees/entities', {
          attachTo: document.body
        })
          .complete()
          .request(changeMultiselect('#entity-filters-conflict', [0]))
          .respondWithData(testData.entityOData)
          .afterResponse(app => {
            app.vm.$route.query.conflict.should.equal('true');
          }));

      it('removes the query parameter if all options are selected', () =>
        load('/projects/1/entity-lists/trees/entities?conflict=true', {
          attachTo: document.body
        })
          .complete()
          .request(changeMultiselect('#entity-filters-conflict', [0, 1]))
          .respondWithData(testData.entityOData)
          .afterResponse(app => {
            should.not.exist(app.vm.$route.query.conflict);
          }));
    });

    describe('after the query parameter is changed', () => {
      it('sends a request', () =>
        load('/projects/1/entity-lists/trees/entities')
          .complete()
          .route('/projects/1/entity-lists/trees/entities?conflict=true')
          .beforeEachResponse((_, { url }) => {
            const filter = relativeUrl(url).searchParams.get('$filter');
            filter.should.equal('__system/conflict ne null');
          })
          .respondWithData(testData.entityOData));

      it('updates the filter component', () =>
        load('/projects/1/entity-lists/trees/entities')
          .complete()
          .route('/projects/1/entity-lists/trees/entities?conflict=true')
          .respondWithData(testData.entityOData)
          .afterResponse(app => {
            const { modelValue } = app.getComponent(EntityFiltersConflict).props();
            modelValue.should.eql([true]);
          }));
    });
  });

  it('shows correct message if there are no entities after filtering', async () => {
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/entities?conflict=true', {
      root: false
    });
    const text = component.get('.empty-table-message').text();
    text.should.equal('There are no matching Entities.');
  });

  it('does not update dataset.entities after filtering', () => {
    testData.extendedDatasets.createPast(1, { entities: 2 });
    // Create an entity without a conflict.
    testData.extendedEntities.createPast(1);
    // Create an entity with a soft conflict.
    testData.extendedEntities.createPast(1);
    testData.extendedEntityVersions.createPast(2, { baseVersion: 1 });
    return load('/projects/1/entity-lists/trees/entities', {
      attachTo: document.body
    })
      .afterResponses(app => {
        app.vm.$container.requestData.dataset.entities.should.equal(2);
      })
      .request(changeMultiselect('#entity-filters-conflict', [0]))
      .respondWithData(() => ({
        ...testData.entityOData(1),
        '@odata.count': 1,
        '@odata.nextLink': undefined
      }))
      .afterResponse(app => {
        app.vm.$container.requestData.dataset.entities.should.equal(2);
      });
  });
});
