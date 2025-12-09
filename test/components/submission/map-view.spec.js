import GeojsonMap from '../../../src/components/geojson-map.vue';
import RadioField from '../../../src/components/radio-field.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import SubmissionMapView from '../../../src/components/submission/map-view.vue';

import testData from '../../data';
import { changeMultiselect } from '../../util/trigger';
import { findTab } from '../../util/dom';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setLuxon } from '../../util/date-time';

const findToggle = (component) =>
  component.getComponent(SubmissionList).findComponent(RadioField);
const toggleView = (view) => (app) =>
  findToggle(app).get(`input[type="radio"][value="${view}"]`).setChecked();
const getView = (app) => {
  // SubmissionTableView always renders #submission-table.
  const hasTable = app.find('#submission-table').exists();
  // In contrast, while SubmissionMapView always tries to render GeojsonMap,
  // there may be a delay, since GeojsonMap is loaded async.
  const hasMap = app.findComponent(SubmissionMapView).exists();
  if (hasTable && hasMap) throw new Error('both views are rendered');
  if (!hasTable && !hasMap) throw new Error('neither view is rendered');
  return hasTable ? 'table' : 'map';
};
const countFeatures = (app) => {
  const { data } = app.getComponent(GeojsonMap).props();
  return data != null ? data.features.length : 0;
};

const mypoint = testData.fields.geopoint('/mypoint');

describe('SubmissionMapView', () => {
  beforeEach(mockLogin);

  describe('toggle', () => {
    it('shows the toggle if the form has a geo field', async () => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
      const app = await load('/projects/1/forms/f/submissions');
      findToggle(app).exists().should.be.true;
    });

    it('does not show toggle if form does not have a geo field', async () => {
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1/forms/f/submissions');
      findToggle(app).exists().should.be.false;
    });

    it('does not show toggle if the only geo field is in a repeat group', async () => {
      testData.extendedForms.createPast(1, {
        fields: [
          testData.fields.repeat('/plot'),
          testData.fields.geopoint('/plot/plotpoint')
        ]
      });
      const app = await load('/projects/1/forms/f/submissions');
      findToggle(app).exists().should.be.false;
    });

    it('does not show toggle on Edit Form page', async () => {
      testData.extendedForms.createPast(1, { draft: true, fields: [mypoint] });
      const app = await load('/projects/1/forms/f/draft');
      findToggle(app).exists().should.be.false;
    });

    it('disables the toggle if there is an encrypted submission', async () => {
      testData.extendedForms.createPast(1, {
        fields: [mypoint],
        key: testData.standardKeys.createPast(1, { managed: true }).last()
      });
      const app = await load('/projects/1/forms/f/submissions');
      findToggle(app).props().disabled.should.be.true;
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
          getView(app).should.equal('map');
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
          getView(app).should.equal('table');
          should.not.exist(app.vm.$route.query.map);
        });
    });
  });

  it('shows map view immediately if ?map=true', () => {
    testData.extendedForms.createPast(1, { fields: [mypoint] });
    return load('/projects/1/forms/f/submissions?map=true')
      .testRequestsInclude([{ url: '/v1/projects/1/forms/f/submissions.geojson' }])
      .afterResponses(app => {
        getView(app).should.equal('map');
      });
  });

  describe('filters', () => {
    beforeEach(() => {
      setLuxon({ defaultZoneName: 'UTC' });
      testData.extendedForms.createPast(1, { fields: [mypoint] });
    });

    it('passes filters through to the request', () =>
      load('/projects/1/forms/f/submissions?map=true&submitterId=1&submitterId=2&start=1970-01-01&end=1970-01-02&reviewState=%27approved%27&reviewState=null')
        .testRequestsInclude([{
          url: ({ pathname, searchParams }) => {
            pathname.should.equal('/v1/projects/1/forms/f/submissions.geojson');
            searchParams.getAll('submitterId').should.eql(['1', '2']);
            searchParams.get('start__gte').should.equal('1970-01-01T00:00:00.000Z');
            searchParams.get('end__lte').should.equal('1970-01-02T23:59:59.999Z');
            searchParams.getAll('reviewState').should.eql(['approved', 'null']);
          }
        }]));

    it('refreshes the map after a filter changes', () => {
      testData.extendedSubmissions.createPast(1, {
        mypoint: 'POINT (1 2)',
        reviewState: 'hasIssues'
      });
      return load('/projects/1/forms/f/submissions?map=true', { attachTo: document.body })
        .afterResponses(app => {
          countFeatures(app).should.equal(1);
        })
        .request(changeMultiselect('#submission-filters-review-state', [1]))
        .beforeEachResponse((app, { url }) => {
          url.should.equal('/v1/projects/1/forms/f/submissions.geojson?reviewState=hasIssues');
          // Not a background refresh: the map disappears during the request.
          countFeatures(app).should.equal(0);
        })
        .respondWithData(testData.submissionGeojson)
        .afterResponse(app => {
          countFeatures(app).should.equal(1);
        });
    });
  });

  describe('deleted submissions', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
    });

    it('shows table view for deleted submissions even when ?map=true', () => {
      testData.extendedSubmissions.createPast(1, { deletedAt: new Date().toISOString() });
      return load('/projects/1/forms/f/submissions?map=true&deleted=true')
        .afterResponses(app => {
          getView(app).should.equal('table');
        });
    });
  });

  describe('after the Refresh button is clicked', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
    });

    it('sends the correct requests', () =>
      load('/projects/1/forms/f/submissions?map=true')
        .complete()
        .request(app =>
          app.get('#refresh-button').trigger('click'))
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
        ]));

    it('updates the map', () => {
      testData.extendedSubmissions.createPast(1, { mypoint: 'POINT (1 2)' });
      return load('/projects/1/forms/f/submissions?map=true')
        .afterResponses(app => {
          countFeatures(app).should.equal(1);
        })
        .request(app =>
          app.get('#refresh-button').trigger('click'))
        .beforeEachResponse((app, _, i) => {
          if (i === 0) countFeatures(app).should.equal(1);
        })
        .respondWithData(() => {
          testData.extendedSubmissions.createNew();
          return testData.submissionGeojson();
        })
        .respondWithData(() => testData.submissionDeletedOData(0))
        .afterResponses(app => {
          countFeatures(app).should.equal(2);
        });
    });
  });

  describe('empty message', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1, { fields: [mypoint] });
    });

    it('shows a message if no submissions are returned', async () => {
      const app = await load('/projects/1/forms/f/submissions?map=true');
      const message = app.get('.empty-table-message');
      message.should.be.visible();
      const text = message.text();
      text.should.equal('No map data available yet. Submissions only appear if they include data in the first geo field. Learn more about mapping Submissions');
      countFeatures(app).should.equal(0);
    });

    it('shows a different message if a filter is applied', async () => {
      const app = await load('/projects/1/forms/f/submissions?map=true&reviewState=null');
      const message = app.get('.empty-table-message');
      message.should.be.visible();
      message.text().should.equal('There are no matching Submissions.');
      countFeatures(app).should.equal(0);
    });

    it('hides the empty message during a new request for GeoJSON', () =>
      load('/projects/1/forms/f/submissions?map=true', { attachTo: document.body })
        .afterResponses(app => {
          app.get('.empty-table-message').should.be.visible();
        })
        .request(changeMultiselect('#submission-filters-review-state', [1]))
        .beforeAnyResponse(app => {
          app.get('.empty-table-message').should.be.hidden();
          app.get('#map-view .loading').should.be.visible();
        })
        .respondWithData(testData.submissionGeojson)
        .afterResponse(app => {
          app.get('.empty-table-message').should.be.visible();
          app.get('#map-view .loading').should.be.hidden();
        }));

    it('hides the empty message after toggling to map view', () =>
      load('/projects/1/forms/f/submissions')
        .afterResponses(app => {
          app.get('.empty-table-message').should.be.visible();
        })
        .request(toggleView('map'))
        .beforeEachResponse(app => {
          // The message should disappear immediately, not just after the
          // GeoJSON response is received.
          app.get('.empty-table-message').should.be.hidden();
        })
        .respondWithData(() => {
          testData.extendedSubmissions.createNew({ mypoint: 'POINT (1 2)' });
          return testData.submissionGeojson();
        })
        .afterResponse(app => {
          app.get('.empty-table-message').should.be.hidden();
          countFeatures(app).should.equal(1);
        }));
  });

  it('does not update the tab badge', async () => {
    testData.extendedForms.createPast(1, { fields: [mypoint], submissions: 2 });
    testData.extendedSubmissions
      .createPast(1, { mypoint: 'POINT (1 2)' })
      .createPast(1, { mypoint: null });
    const app = await load('/projects/1/forms/f/submissions?map=true');
    countFeatures(app).should.equal(1);
    // Even though there is only one submission in the GeoJSON, that should not
    // change the submission count in the tab badge.
    findTab(app, 'Submissions').get('.badge').text().should.equal('2');
  });
});
