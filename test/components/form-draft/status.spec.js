import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftStatus', () => {
  beforeEach(mockLogin);

  it('shows the version string of the draft', () => {
    testData.extendedForms.createPast(1, { version: 'v1' });
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return load('/projects/1/forms/f/draft/status').then(app => {
      const text = app.first('.form-version-summary-item-version').text().trim();
      text.should.equal('v2');
    });
  });
});
