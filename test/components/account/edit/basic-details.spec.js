import faker from '../../../faker';
import testData from '../../../data';
import { mockLogin } from '../../../session';
import { mockRoute } from '../../../http';
import { submitForm } from '../../../event';

describe('AccountEditBasicDetails', () => {
  beforeEach(mockLogin);

  it('standard button thinking things', () =>
    mockRoute('/account/edit')
      .request(app => submitForm(app, '#account-edit-basic-details form', [
        ['input[type="email"]', faker.internet.email()]
      ]))
      .standardButton('#account-edit-basic-details button'));

  it('shows a success alert after a successful submit', () => {
    const newEmail = faker.internet.uniqueEmail();
    return mockRoute('/account/edit')
      .request(app => submitForm(app, '#account-edit-basic-details form', [
        ['input[type="email"]', newEmail]
      ]))
      .respondWithData(() => {
        const user = testData.administrators.last();
        testData.administrators.update(user, { email: newEmail });
        return user;
      })
      .afterResponse(app => app.should.alert('success'));
  });

  it("updates the user's display name after a successful submit", () => {
    const user = testData.administrators.last();
    const newName = `${user.displayName}x`;
    return mockRoute('/account/edit')
      .request(app => submitForm(app, '#account-edit-basic-details form', [
        ['input[type="text"]', newName]
      ]))
      .respondWithData(() => {
        testData.administrators.update(user, { displayName: newName });
        return user;
      })
      .afterResponse(app => {
        app.first('.dropdown-toggle').text().trim().should.equal(user.displayName);
        app.first('#page-head-title').text().should.equal(user.displayName);
      });
  });
});
