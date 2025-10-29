import { T } from 'ramda';

import DateTime from '../../../src/components/date-time.vue';
import DlData from '../../../src/components/dl-data.vue';
import GeojsonMap from '../../../src/components/geojson-map.vue';
import SubmissionAttachmentLink from '../../../src/components/submission/attachment-link.vue';
import SubmissionDelete from '../../../src/components/submission/delete.vue';
import SubmissionMapPopup from '../../../src/components/submission/map-popup.vue';
import SubmissionReviewState from '../../../src/components/submission/review-state.vue';
import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';

import useFields from '../../../src/request-data/fields';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const project = testData.extendedProjects.last();
  const projectId = project.id.toString();
  const form = testData.extendedForms.last();
  const { xmlFormId } = form;
  const { instanceId } = testData.extendedSubmissions.last();
  return mergeMountOptions(options, {
    props: { projectId, xmlFormId, instanceId, fieldpath: '/p1' },
    container: {
      router: mockRouter(`/projects/${projectId}/forms/${encodeURIComponent(xmlFormId)}/submissions?map=true`),
      requestData: testRequestData([useFields], {
        project,
        form,
        fields: form._fields
      })
    }
  });
};

describe('SubmissionMapPopup', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Allison' });
    testData.extendedForms.createPast(1, {
      xmlFormId: 'a b',
      fields: [
        testData.fields.group('/names'),
        testData.fields.string('/names/first_name'),
        testData.fields.geopoint('/p1'),
        testData.fields.geopoint('/p2')
      ],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 'c d',
      reviewState: 'hasIssues',
      meta: { instanceName: 'Some instance' },
      names: { first_name: 'Someone' },
      p1: 'POINT (1 1)',
      p2: 'POINT (2 2)'
    });
  });

  it('does nothing if instanceId is not defined', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions({
        props: { instanceId: null, fieldpath: null }
      }))
      .testNoRequest()
      .afterResponses(component => {
        component.should.be.hidden();
      }));

  it('sends the correct request', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .testRequests([{
        url: "/v1/projects/1/forms/a%20b.svc/Submissions('c%20d')?%24wkt=true"
      }]));

  describe('title', () => {
    it('shows the review state', () =>
      mockHttp()
        .mount(SubmissionMapPopup, mountOptions())
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const { value } = component.getComponent(SubmissionReviewState).props();
          value.should.equal('hasIssues');
        }));

    it('shows the instance name if there is one', () =>
      mockHttp()
        .mount(SubmissionMapPopup, mountOptions())
        .respondWithData(testData.submissionOData)
        .afterResponse(async (component) => {
          const span = component.get('.submission-review-state + span');
          span.text().should.equal('Some instance');
          await span.should.have.textTooltip();
        }));

    it('falls back to static text', () => {
      testData.extendedSubmissions.reset();
      testData.extendedSubmissions.createPast(1, { p1: 'POINT (3 3)' });
      return mockHttp()
        .mount(SubmissionMapPopup, mountOptions())
        .respondWithData(testData.submissionOData)
        .afterResponse(component => {
          const text = component.get('.submission-review-state + span').text();
          text.should.equal('Submission Details');
        });
    });
  });

  it('shows submission metadata', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const dd = component.findAll('dd');
        dd[0].text().should.equal('Allison');
        await dd[0].should.have.textTooltip();

        const { createdAt } = testData.extendedSubmissions.last();
        dd[1].getComponent(DateTime).props().iso.should.equal(createdAt);
      }));

  it('shows form-field data', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const pairs = component.findAllComponents(DlData);
        const names = pairs.map(pair => pair.get('dt .field-name').text());
        names.should.eql(['first_name', 'p1', 'p2']);

        const values = pairs.map(pair => pair.props().value);
        values.should.eql(['Someone', 'POINT (1 1)', 'POINT (2 2)']);
      }));

  it('formats form-field data', () => {
    testData.extendedForms.createPast(1, {
      xmlFormId: 'f',
      fields: [
        testData.fields.int('/i1'),
        testData.fields.int('/i2'),
        testData.fields.binary('/b1'),
        testData.fields.binary('/b2'),
        testData.fields.geopoint('/p1')
      ]
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 's',
      i1: 1000,
      i2: null,
      b1: 'foo.jpg',
      b2: null,
      p1: 'POINT (1 1)'
    });
    return mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const dd = component.findAll('.dl-data-dd');
        dd.length.should.equal(5);

        dd[0].text().should.equal('1,000');
        dd[1].text().should.equal('(empty)');

        dd[2].getComponent(SubmissionAttachmentLink).props().should.eql({
          projectId: '1',
          xmlFormId: 'f',
          draft: false,
          instanceId: 's',
          attachmentName: 'foo.jpg',
          deleted: false
        });
        dd[2].text().should.equal('');

        dd[3].findComponent(SubmissionAttachmentLink).exists().should.be.false;
        dd[3].text().should.equal('(empty)');
      });
  });

  it('shows tooltips for form-field data', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const pair = component.getComponent(DlData);
        const name = pair.get('dt span');
        name.text().should.equal('first_name');
        await name.should.have.tooltip('names-first_name');
        pair.get('dd').should.have.textTooltip();
      }));

  it('shows a warning if geo field is not in current version of form', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions({
        props: { fieldpath: '/old_group/old_field' }
      }))
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const warning = component.get('dl + div');
        warning.find('.icon-warning').exists().should.be.true;
        const field = warning.get('strong');
        field.text().should.equal('old_field');
        await field.should.have.tooltip('old_group-old_field');

        // The fields that actually are in the current version of the form
        // should be shown in form order.
        const names = component.findAllComponents(DlData)
          .map(pair => pair.get('dt').text());
        names.should.eql(['first_name', 'p1', 'p2']);
      }));

  it('updates after the instanceId changes', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .complete()
      .request(component => {
        testData.extendedSubmissions.createNew({
          instanceId: 'another',
          p1: 'POINT (3 3)'
        });
        return component.setProps({ instanceId: 'another' });
      })
      .respondWithData(() => testData.submissionOData(1))
      .testRequests([{
        url: ({ pathname }) => {
          pathname.should.contain('another');
        }
      }])
      .afterResponse(component => {
        const pair = component.findAllComponents(DlData)[1];
        pair.get('dt .field-name').text().should.equal('p1');
        pair.props().value.should.equal('POINT (3 3)');
      }));

  it('shows checkmark for the mapped field', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const pair = component.findAllComponents(DlData)[1];
        pair.find('.icon-check-circle').exists().should.be.true;
      }));

  describe('review button', () => {
    const review = (confirm = true) => load('/projects/1/forms/a%20b/submissions?map=true')
      .complete()
      .request(app => {
        app.getComponent(GeojsonMap).vm.selectFeature('c d');
      })
      .respondWithData(testData.submissionOData)
      .complete()
      .request(async (app) => {
        await app.get('#submission-map-popup .review-button').trigger('click');
        if (confirm) {
          await app.get('#submission-update-review-state input[value="approved"]').setChecked();
          await app.get('#submission-update-review-state form').trigger('submit');
        }
      })
      .respondIf(T, () => {
        testData.extendedSubmissions.update(-1, { reviewState: 'approved' });
        return testData.standardSubmissions.last();
      });

    it('shows the modal', async () => {
      const app = await review(false);
      app.getComponent(SubmissionUpdateReviewState).props().state.should.be.true;
    });

    it('sends the correct request', () =>
      review().testRequests([{
        method: 'PATCH',
        url: '/v1/projects/1/forms/a%20b/submissions/c%20d',
        data: { reviewState: 'approved' }
      }]));

    it('updates the review state', async () => {
      const app = await review();
      const { value } = app.getComponent(SubmissionMapPopup)
        .getComponent(SubmissionReviewState)
        .props();
      value.should.equal('approved');

      await app.get('#submission-map-popup .review-button').trigger('click');
      const input = app.get('#submission-update-review-state input[value="approved"]');
      input.element.checked.should.be.true;
    });
  });

  describe('delete button', () => {
    const del = (confirm = true) => load('/projects/1/forms/a%20b/submissions?map=true')
      .complete()
      .request(app => {
        app.getComponent(GeojsonMap).vm.selectFeature('c d');
      })
      .respondWithData(testData.submissionOData)
      .complete()
      .request(async (app) => {
        await app.get('#submission-map-popup .delete-button').trigger('click');
        if (confirm)
          await app.get('#submission-delete .btn-danger').trigger('click');
      })
      .respondIf(T, () => ({ success: true }));

    it('shows the modal', async () => {
      const app = await del(false);
      app.getComponent(SubmissionDelete).props().state.should.be.true;
    });

    it('sends the correct request', () =>
      del().testRequests([{
        method: 'DELETE',
        url: '/v1/projects/1/forms/a%20b/submissions/c%20d'
      }]));

    it('removes the feature from the map', () =>
      del()
        .beforeAnyResponse(app => {
          app.getComponent(GeojsonMap).vm.getFeatures().length.should.equal(1);
        })
        .afterResponse(app => {
          app.getComponent(GeojsonMap).vm.getFeatures().length.should.equal(0);
        }));

    it('hides the popup', async () => {
      const app = await del();
      app.getComponent(SubmissionMapPopup).should.be.hidden();
    });
  });
});
