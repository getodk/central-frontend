import { DateTime, Settings } from 'luxon';
import EntityFiltersConflict from '../../../src/components/entity/filters/conflict.vue';
import EntityMetadataRow from '../../../src/components/entity/metadata-row.vue';
import DateRangePicker from '../../../src/components/date-range-picker.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { relativeUrl } from '../../util/request';
import { setLuxon } from '../../util/date-time';

const createFieldKeys = (count) => new Array(count).fill(undefined)
  .map((_, i) => testData.extendedFieldKeys
    .createPast(1, { displayName: `App User ${i}` })
    .last());

describe('EntityFilters', () => {
  beforeEach(mockLogin);

  beforeEach(() => {
    setLuxon({ defaultZoneName: 'UTC' });
  });

  describe('conflict filter', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    describe('initial request', () => {
      it('does not filter by conflict by default', () =>
        load('/projects/1/entity-lists/trees/entities', { root: false })
          .testRequestsInclude([{
            url: ({ searchParams }) => {
              // Checking for 250 to confirm that it's the request for the
              // actual data, not just the deletion count.
              searchParams.get('$top').should.equal('250');
              const filter = searchParams.get('$filter');
              filter.should.not.match(/__system\/conflict ne null/);
            }
          }]));

      it('sends the correct request for ?conflict=true', () =>
        load('/projects/1/entity-lists/trees/entities?conflict=true', { root: false })
          .testRequestsInclude([{
            url: ({ searchParams }) => {
              searchParams.get('$top').should.equal('250');
              const filter = searchParams.get('$filter');
              filter.should.match(/__system\/conflict ne null/);
            }
          }]));

      it('sends the correct request for ?conflict=false', () =>
        load('/projects/1/entity-lists/trees/entities?conflict=false', { root: false })
          .testRequestsInclude([{
            url: ({ searchParams }) => {
              searchParams.get('$top').should.equal('250');
              const filter = searchParams.get('$filter');
              filter.should.match(/__system\/conflict eq null/);
            }
          }]));

      it('filters on creator if ?creator is specified', () =>
        load('/projects/1/entity-lists/trees/entities?creatorId=1&creatorId=2')
          .testRequestsInclude([{
            url: ({ searchParams }) => {
              searchParams.get('$top').should.equal('250');
              const filter = searchParams.get('$filter');
              filter.should.match(/__system\/creatorId eq 1 or __system\/creatorId eq 2/);
            }
          }]));
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
            .testRequestsInclude([{
              url: ({ searchParams }) => {
                searchParams.get('$top').should.equal('250');
                searchParams.get('$filter').should.not.match(/conflict/);
              }
            }]));
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
            filter.should.match(/__system\/conflict ne null/);
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
            filter.should.match(/__system\/conflict ne null/);
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

  describe('creator filter', () => {
    beforeEach(() => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 3 });
      testData.extendedDatasets.createPast(1, { entities: 3 });
      const fieldKeys = createFieldKeys(3);
      testData.extendedEntities
        .createPast(1, { creator: fieldKeys[2] })
        .createPast(1, { creator: fieldKeys[1] })
        .createPast(1, { creator: fieldKeys[0] });
    });

    it('sends a request', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(changeMultiselect('#entity-filters-creator', [0]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          const { id } = testData.extendedFieldKeys.first();
          filter.should.include(`(__system/creatorId eq ${id})`);
        })
        .respondWithData(() => ({
          ...testData.entityOData(1),
          '@odata.count': 1
        })));

    it('updates the URL', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(changeMultiselect('#entity-filters-creator', [0]))
        .respondWithData(() => ({
          ...testData.entityOData(1),
          '@odata.count': 1
        }))
        .afterResponse(component => {
          const { creatorId } = component.vm.$route.query;
          const { id } = testData.extendedFieldKeys.first();
          creatorId.should.eql([id.toString()]);
        }));

    it('re-renders the table', () => {
      testData.extendedEntities.createPast(250);
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(component => {
          component.get('button[aria-label="Next page"]').trigger('click');
        })
        .respondWithData(() => testData.entityOData(250, 250))
        .afterResponse(component => {
          component.findAllComponents(EntityMetadataRow).length.should.equal(3);
        })
        .request(changeMultiselect('#entity-filters-creator', [0]))
        .beforeEachResponse((component, { url }) => {
          component.findComponent(EntityMetadataRow).exists().should.be.false;
          relativeUrl(url).searchParams.get('$skip').should.be.eql('0');
        })
        .respondWithData(() => ({
          ...testData.entityOData(1),
          '@odata.count': 1
        }))
        .afterResponse(component => {
          component.findAllComponents(EntityMetadataRow).length.should.equal(1);
        });
    });

    it('allows multiple creators to be selected', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(changeMultiselect('#entity-filters-creator', [0, 1]))
        .beforeEachResponse((_, { url }) => {
          const filter = relativeUrl(url).searchParams.get('$filter');
          const id0 = testData.extendedFieldKeys.get(0).id;
          const id1 = testData.extendedFieldKeys.get(1).id;
          filter.should.include(`(__system/creatorId eq ${id0} or __system/creatorId eq ${id1})`);
        })
        .respondWithData(() => ({
          ...testData.entityOData(2),
          '@odata.count': 2
        })));
  });

  describe('createdAt filter', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('sends a request', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(component => {
          component.getComponent(DateRangePicker).vm.close([
            DateTime.fromISO('1970-01-01').toJSDate(),
            DateTime.fromISO('1970-01-02').toJSDate()
          ]);
        })
        .beforeEachResponse((_, { url }) => {
          const filters = new URL(url, window.location.origin).searchParams.get('$filter').split(' and ');

          const start = filters[2].split(' ge ')[1];
          start.should.equal('1970-01-01T00:00:00.000Z');

          DateTime.fromISO(start).zoneName.should.equal(Settings.defaultZoneName);

          const end = filters[3].split(' le ')[1];
          end.should.equal('1970-01-02T23:59:59.999Z');
          DateTime.fromISO(end).zoneName.should.equal(Settings.defaultZoneName);
        })
        .respondWithData(testData.entityOData));

    it('updates the URL', () =>
      load('/projects/1/entity-lists/trees/entities', {
        attachTo: document.body
      })
        .complete()
        .request(component => {
          component.getComponent(DateRangePicker).vm.close([
            DateTime.fromISO('1970-01-01').toJSDate(),
            DateTime.fromISO('1970-01-02').toJSDate()
          ]);
        })
        .respondWithData(testData.entityOData)
        .afterResponse(component => {
          const { start, end } = component.vm.$route.query;
          start.should.equal('1970-01-01');
          end.should.equal('1970-01-02');
        }));
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

  it('disables the filter', () => {
    testData.extendedDatasets.createPast(1);
    testData.extendedEntities.createPast(1, { deletedAt: new Date().toISOString() });
    return load('/projects/1/entity-lists/trees/entities?deleted=true', {
      attachTo: document.body
    })
      .afterResponses(component => {
        const conflictFilter = component.findAll('.multiselect select');
        conflictFilter[0].attributes('aria-disabled').should.equal('true');
        conflictFilter[1].attributes('aria-disabled').should.equal('true');
        component.getComponent(DateRangePicker).props().disabled.should.be.true;
      });
  });

  describe('reset button', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('resets the filters when clicked', () =>
      load('/projects/1/entity-lists/trees/entities?conflict=true&creatorId=1')
        .complete()
        .request(component => {
          component.get('.btn-reset').trigger('click');
        })
        .respondWithData(testData.entityOData)
        .afterResponses(component => {
          should.not.exist(component.vm.$route.query.conflict);
        }));
  });
});
