import DateTime from '../../../src/components/date-time.vue';
import DlData from '../../../src/components/dl-data.vue';
import SubmissionMapPopup from '../../../src/components/submission/map-popup.vue';

import useFields from '../../../src/request-data/fields';

import testData from '../../data';
import { mergeMountOptions } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const form = testData.extendedForms.last();
  const { instanceId } = testData.extendedSubmissions.last();
  return mergeMountOptions(options, {
    props: {
      projectId: form.projectId.toString(),
      xmlFormId: form.xmlFormId,
      instanceId,
      fieldpath: '/p1'
    },
    container: {
      requestData: testRequestData([useFields], { fields: form._fields })
    }
  });
};

describe('SubmissionMapPopup', () => {
  beforeEach(() => {
    testData.extendedUsers.createPast(1, { displayName: 'Allison' });
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

  it('shows form-field data, ordering the geo field first', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const pairs = component.findAllComponents(DlData);
        const names = pairs.map(pair => pair.get('dt').text());
        names.should.eql(['p1', 'first_name', 'p2']);

        const values = pairs.map(pair => pair.props().value);
        values.should.eql(['POINT (1 1)', 'Someone', 'POINT (2 2)']);
      }));

  it('shows tooltips for form-field data', () =>
    mockHttp()
      .mount(SubmissionMapPopup, mountOptions())
      .respondWithData(testData.submissionOData)
      .afterResponse(async (component) => {
        const pair = component.findAllComponents(DlData)[1];
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
        const pair = component.getComponent(DlData);
        pair.get('dt').text().should.equal('p1');
        pair.props().value.should.equal('POINT (3 3)');
      }));
});
