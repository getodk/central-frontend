import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormSubmissions', () => {
  beforeEach(mockLogin);

  it('passes the correct baseUrl prop to SubmissionList', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/submissions', { component: true }, {})
      .then(component => {
        const baseUrl = component.first(SubmissionList).getProp('baseUrl');
        baseUrl.should.equal('/v1/projects/1/forms/f');
      });
  });
});
