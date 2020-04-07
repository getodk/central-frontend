import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { collectQrData } from '../../util/collect-qr';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftTesting', () => {
  beforeEach(mockLogin);

  it('shows a QR code that encodes the correct settings', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft/testing', { component: true }, {})
      .then(component => {
        // avoriaz can't seem to find the <img> element (maybe because we use
        // v-html?). We use a little vanilla JavaScript to find it ourselves.
        const span = component.first('#form-draft-testing-info .float-row span').element;
        span.children.length.should.equal(1);
        const img = span.children[0];
        img.tagName.should.equal('IMG');
        const { draftToken } = testData.extendedFormDrafts.last();
        collectQrData(img).should.eql({
          general: {
            server_url: `${window.location.origin}/v1/test/${draftToken}/projects/1/forms/f/draft`
          },
          admin: {}
        });
      });
  });

  it('passes the correct baseUrl prop to SubmissionList', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft/testing', { component: true }, {})
      .then(component => {
        const baseUrl = component.first(SubmissionList).getProp('baseUrl');
        baseUrl.should.equal('/v1/projects/1/forms/f/draft');
      });
  });
});
