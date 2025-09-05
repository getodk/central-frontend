import { F } from 'ramda';

import GeojsonMap from '../../../src/components/geojson-map.vue';
import RadioButtons from '../../../src/components/radio-buttons.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { findTab } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';

const toggleView = (view) => (app) => {
  const input = app.get(`#submission-list .radio-buttons input[type="radio"][value="${view}"]`);
  return input.setChecked();
};

const mypoint = testData.fields.geopoint('/mypoint');

describe('SubmissionMapView', () => {
  beforeEach(mockLogin);

  describe('toggle', () => {
    it('shows the toggle if the form has a geo field', async () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      const component = await load('/projects/1/forms/a%20b/submissions', {
        root: false
      });
      component.findComponent(RadioButtons).exists().should.be.true;
    });

    it('does not show toggle if form does not have a geo field', async () => {
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/a%20b/submissions', {
        root: false
      });
      component.findComponent(RadioButtons).exists().should.be.false;
    });

    it('does not show toggle if the only geo field is in a repeat group', async () => {
      testData.extendedForms.createPast(1, {
        fields: [
          testData.fields.repeat('/plot'),
          testData.fields.geopoint('/plot/plotpoint')
        ]
      });
      const component = await load('/projects/1/forms/f/submissions', { root: false });
      component.findComponent(RadioButtons).exists().should.be.false;
    });

    it('disables the toggle if there is an encrypted submission', async () => {
      testData.extendedForms.createPast(1, {
        fields: [mypoint],
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      const component = await load('/projects/1/forms/a%20b/submissions', {
        root: false
      });
      component.getComponent(RadioButtons).props().disabled.should.be.true;
    });

    it('switches to map view', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        fields: [mypoint]
      });
      return load('/projects/1/forms/a%20b/submissions')
        .complete()
        .request(toggleView('map'))
        .respondWithData(testData.submissionGeojson)
        .testRequests([{ url: '/v1/projects/1/forms/a%20b/submissions.geojson' }])
        .afterResponses(app => {
          app.find('.geojson-map').exists().should.be.true;
          app.find('#submission-table').exists().should.be.false;
          expect(app.vm.$route.query.map).to.equal('true');
        });
    });

    it('switches back to table view', () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      return load('/projects/1/forms/f/submissions')
        .complete()
        .request(toggleView('map'))
        .respondWithData(testData.submissionGeojson)
        .complete()
        .request(toggleView('table'))
        .respondWithData(testData.submissionOData)
        .testRequests([{
          url: ({ pathname }) => {
            pathname.should.equal('/v1/projects/1/forms/f.svc/Submissions');
          }
        }])
        .afterResponses(app => {
          app.find('#submission-table').exists().should.be.true;
          app.find('.geojson-map').exists().should.be.false;
          should.not.exist(app.vm.$route.query.map);
        });
    });
  });

  describe('?map=true', () => {
    it('shows the map immediately if ?map=true', () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      return load('/projects/1/forms/f/submissions?map=true')
        .testRequestsInclude([{ url: '/v1/projects/1/forms/f/submissions.geojson' }])
        .afterResponses(component => {
          component.find('.geojson-map').exists().should.be.true;
        });
    });

    it('redirects from the map if the form does not have a geo field', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/submissions?map=true')
        .testRequestsInclude([
          { url: '/v1/projects/1/forms/f/submissions.geojson' },
          {
            url: ({ pathname, searchParams }) => {
              pathname.should.equal('/v1/projects/1/forms/f.svc/Submissions');
              // Check that it's not the request for deletedSubmissionCount,
              // where $top=0.
              searchParams.get('$top').should.equal('250');
            }
          }
        ])
        .afterResponses(app => {
          app.find('#submission-table').exists().should.be.true;
          app.find('.geojson-map').exists().should.be.false;
          should.not.exist(app.vm.$route.query.map);
        });
    });

    it('redirects from map if there is an encrypted submission', async () => {
      testData.extendedForms.createPast(1, {
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      const app = await load('/projects/1/forms/f/submissions?map=true');
      app.find('#submission-table').exists().should.be.true;
      app.find('.geojson-map').exists().should.be.false;
      should.not.exist(app.vm.$route.query.map);
    });

    it('ignores ?map=true for a form draft', () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      return load('/projects/1/forms/f/draft?map=true')
        .beforeEachResponse((_, { url }) => {
          url.should.not.contain('.geojson');
        })
        .afterResponses(app => {
          app.find('.geojson-map').exists().should.be.false;
        });
    });
  });

  it('passes filters through to the request', () => {
    setLuxon({ defaultZoneName: 'UTC' });
    testData.extendedForms.createPast(1, { fields: [mypoint] });
    return load('/projects/1/forms/f/submissions?map=true&submitterId=1&submitterId=2&start=1970-01-01&end=1970-01-02&reviewState=%27approved%27&reviewState=null')
      .testRequestsInclude([{
        url: ({ pathname, searchParams }) => {
          pathname.should.equal('/v1/projects/1/forms/f/submissions.geojson');
          searchParams.getAll('submitterId').should.eql(['1', '2']);
          searchParams.get('start__gte').should.equal('1970-01-01T00:00:00.000Z');
          searchParams.get('end__lte').should.equal('1970-01-02T23:59:59.999Z');
          searchParams.getAll('reviewState').should.eql(['approved', 'null']);
        }
      }]);
  });

  it('shows a map for deleted submissions', () => {
    testData.extendedForms.createPast(1, { fields: [mypoint] });
    testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
    return load('/projects/1/forms/f/submissions?map=true&deleted=true')
      .testRequestsInclude([{
        url: '/v1/projects/1/forms/f/submissions.geojson?deleted=true'
      }])
      .afterResponses(app => {
        app.find('.geojson-map').exists().should.be.true;
      });
  });

  it('preserves map view while toggling deleted submissions', () => {
    testData.extendedForms.createPast(1, { fields: [mypoint] });
    testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
    return load('/projects/1/forms/f/submissions?map=true&reviewState=null')
      .complete()
      .request(app => app.get('.toggle-deleted-submissions').trigger('click'))
      .respondWithData(testData.submissionGeojson)
      .testRequestsInclude([{
        // Map view is preserved, but the review state filter is not.
        url: '/v1/projects/1/forms/f/submissions.geojson?deleted=true'
      }])
      .afterResponse(app => {
        app.find('.geojson-map').exists().should.be.true;
        const { fullPath } = app.vm.$route;
        fullPath.should.equal('/projects/1/forms/f/submissions?deleted=true&map=true');
      })
      .request(app => app.get('.toggle-deleted-submissions').trigger('click'))
      .respondWithData(() => testData.submissionGeojson(F))
      .afterResponse(app => {
        app.find('.geojson-map').exists().should.be.true;
        const { fullPath } = app.vm.$route;
        fullPath.should.equal('/projects/1/forms/f/submissions?map=true');
      });
  });

  it('refreshes after a filter changes', () => {
    testData.extendedForms.createPast(1, { fields: [mypoint] });
    return load('/projects/1/forms/f/submissions?map=true', { attachTo: document.body })
      .complete()
      .request(changeMultiselect('#submission-filters-review-state', [1]))
      .beforeEachResponse((app, { url }) => {
        url.should.equal('/v1/projects/1/forms/f/submissions.geojson?reviewState=hasIssues');
        app.find('.geojson-map').exists().should.be.false;
      })
      .respondWithData(testData.submissionGeojson)
      .afterResponse(app => {
        app.find('.geojson-map').exists().should.be.true;
      });
  });

  describe('after the Refresh button is clicked', () => {
    it('sends the correct requests', () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      return load('/projects/1/forms/f/submissions?map=true')
        .complete()
        .request(app =>
          app.get('#submission-list-refresh-button').trigger('click'))
        .respondWithData(testData.submissionGeojson)
        .respondWithData(() => testData.submissionDeletedOData(0))
        .testRequests([
          { url: '/v1/projects/1/forms/f/submissions.geojson' },
          {
            // deletedSubmissionCount
            url: ({ pathname, searchParams }) => {
              pathname.should.equal('/v1/projects/1/forms/f.svc/Submissions');
              searchParams.get('$filter').should.equal('__system/deletedAt ne null');
              searchParams.get('$top').should.equal('0');
            }
          }
        ]);
    });

    it('updates the map', () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      testData.extendedSubmissions.createPast(1, { mypoint: 'POINT (1 2)' });
      const assertCount = (component, count) => {
        const { features } = component.getComponent(GeojsonMap).props();
        features.length.should.equal(count);
      };
      return load('/projects/1/forms/f/submissions?map=true')
        .afterResponses(app => {
          assertCount(app, 1);
        })
        .request(app =>
          app.get('#submission-list-refresh-button').trigger('click'))
        .beforeEachResponse((app, _, i) => {
          if (i === 0) assertCount(app, 1);
        })
        .respondWithData(() => {
          testData.extendedSubmissions.createNew();
          return testData.submissionGeojson();
        })
        .respondWithData(() => testData.submissionDeletedOData(0))
        .afterResponses(app => {
          assertCount(app, 2);
        });
    });
  });

  it('does not update the tab badge', async () => {
    testData.extendedForms.createPast(1, { fields: [mypoint], submissions: 2 });
    testData.extendedSubmissions
      .createPast(1, { mypoint: 'POINT (1 2)' })
      .createPast(1, { mypoint: null });
    testData.submissionGeojson().features.length.should.equal(1);
    const app = await load('/projects/1/forms/f/submissions?map=true');
    // Even though there is only one submission in the GeoJSON, that should not
    // change the submission count in the tab badge.
    findTab(app, 'Submissions').get('.badge').text().should.equal('2');
  });
});
