import testData from '../../../data';
import { mockLogin } from '../../../session';
import { mockRoute } from '../../../http';
import { submitForm } from '../../../event';

describe('UserEditBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Old Name', email: 'old@email.com' });
  });

  it('standard button thinking things', () =>
    mockRoute('/account/edit')
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .standardButton('#user-edit-basic-details button'));

  it('shows a success alert after a successful submit', () =>
    mockRoute('/account/edit')
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .respondWithData(() => {
        testData.extendedUsers.update(testData.extendedUsers.last(), {
          email: 'new@email.com'
        });
        return testData.standardUsers.last();
      })
      .afterResponse(app => {
        app.should.alert('success');
      }));

  it("updates the user's display name after a successful submit", () =>
    mockRoute('/account/edit')
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="text"]', 'New Name']
      ]))
      .respondWithData(() => {
        testData.extendedUsers.update(testData.extendedUsers.last(), {
          displayName: 'New Name'
        });
        return testData.standardUsers.last();
      })
      .afterResponse(app => {
        app.first('.dropdown-toggle').text().trim().should.equal('New Name');
        app.first('#page-head-title').text().should.equal('New Name');
      }));
});
