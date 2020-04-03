import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionList', () => {
  beforeEach(mockLogin);

  it('sends the correct request', () => {
    testData.extendedForms.createPast(1);
    let success = false;
    return load('/projects/1/forms/f/versions')
      .beforeEachResponse((app, { method, url, headers }) => {
        if (url === '/v1/projects/1/forms/f/versions') {
          method.should.equal('GET');
          headers['X-Extended-Metadata'].should.equal('true');
          success = true;
        }
      })
      .afterResponses(() => {
        success.should.be.true();
      });
  });
});
