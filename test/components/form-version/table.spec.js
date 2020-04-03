import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionTable', () => {
  beforeEach(mockLogin);

  it('renders the correct number of rows', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2' });
    return load('/projects/1/forms/f/versions').then(app => {
      app.find('#form-version-table tbody tr').length.should.equal(2);
    });
  });
});
