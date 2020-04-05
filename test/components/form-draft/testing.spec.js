import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftTesting', () => {
  beforeEach(mockLogin);

  it('passes the correct baseUrl prop to SubmissionList', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft/testing', { component: true }, {})
      .then(component => {
        const baseUrl = component.first(SubmissionList).getProp('baseUrl');
        baseUrl.should.equal('/v1/projects/1/forms/f/draft');
      });
  });
});
