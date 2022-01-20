import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionList', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/versions').testRequests([
      { url: '/v1/projects/1/forms/f/versions', extended: true }
    ]);
  });
});
