import testData from '../../../data';
import { fillForm, submitForm } from '../../../util/event';
import { load, mockRoute } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('UserEditBasicDetails', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Old Name', email: 'old@email.com' });
  });

  it('updates after a route update', () =>
    mockRoute('/users/1/edit')
      .respondWithData(() => testData.standardUsers.last())
      .afterResponse(app => {
        const form = app.first('#user-edit-basic-details form');
        const emailInput = form.first('input[type="email"]');
        emailInput.element.value.should.equal('old@email.com');
        const displayNameInput = form.first('input[type="text"]');
        displayNameInput.element.value.should.equal('Old Name');
        return fillForm(form, [
          ['input[type="email"]', 'new@email.com'],
          ['input[type="text"]', 'New Name']
        ]);
      })
      .route('/users/2/edit')
      .respondWithData(() => testData.standardUsers
        .createPast(1, { email: 'another@email.com', displayName: 'Another Name' })
        .last())
      .afterResponse(app => {
        const form = app.first('#user-edit-basic-details form');
        const emailInput = form.first('input[type="email"]');
        emailInput.element.value.should.equal('another@email.com');
        const displayNameInput = form.first('input[type="text"]');
        displayNameInput.element.value.should.equal('Another Name');
      }));

  it('standard button thinking things', () =>
    mockRoute('/account/edit')
      .respondWithData(() => testData.standardUsers.last())
      .complete()
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .standardButton('#user-edit-basic-details button'));

  it('shows a success alert after a successful submit', () =>
    mockRoute('/account/edit')
      .respondWithData(() => testData.standardUsers.last())
      .complete()
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="email"]', 'new@email.com']
      ]))
      .respondWithData(() => {
        testData.extendedUsers.update(-1, { email: 'new@email.com' });
        return testData.standardUsers.last();
      })
      .afterResponse(app => {
        app.should.alert('success');
      }));

  it("updates the user's display name after a successful submit", () =>
    load('/account/edit')
      .complete()
      .request(app => submitForm(app, '#user-edit-basic-details form', [
        ['input[type="text"]', 'New Name']
      ]))
      .respondWithData(() => {
        testData.extendedUsers.update(-1, { displayName: 'New Name' });
        return testData.standardUsers.last();
      })
      .afterResponse(app => {
        app.first('#navbar-actions > a').text().trim().should.equal('New Name');
        app.first('#page-head-title').text().trim().should.equal('New Name');
      }));
});
