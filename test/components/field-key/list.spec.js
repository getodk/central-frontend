import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FieldKeyList', () => {
  beforeEach(mockLogin);

  it('shows a message if there are no app users', () => {
    testData.extendedProjects.createPast(1, { appUsers: 0 });
    return load('/projects/1/app-users').then(app => {
      app.find('.empty-table-message').length.should.equal(1);
    });
  });
});
