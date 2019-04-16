import AccountEditPassword from '../../../../lib/components/account/edit/password.vue';
import { mockHttp, mockRoute } from '../../../http';
import { mockLogin } from '../../../session';
import { mountAndMark } from '../../../destroy';
import { submitForm } from '../../../event';

const submitPasswords = (wrapper, { match }) =>
  submitForm(wrapper, '#account-edit-password form', [
    ['#account-edit-password-old-password', 'x'],
    ['#account-edit-password-new-password', 'y'],
    ['#account-edit-password-confirm', match ? 'y' : 'z']
  ]);

describe('AccountEditPassword', () => {
  beforeEach(mockLogin);

  it('standard button thinking things', () =>
    mockRoute('/account/edit')
      .request(app => submitPasswords(app, { match: true }))
      .standardButton('#account-edit-password button'));

  it('shows a success alert after a successful submit', () =>
    mockRoute('/account/edit')
      .request(app => submitPasswords(app, { match: true }))
      .respondWithSuccess()
      .afterResponse(app => app.should.alert('success')));

  describe('new passwords do not match', () => {
    it('shows a danger alert', () =>
      mockRoute('/account/edit')
        .then(app => submitPasswords(app, { match: false }))
        .then(app => app.should.alert('danger')));

    it('adds .has-error to the fields', () =>
      submitPasswords(mountAndMark(AccountEditPassword), { match: false })
        .then(component => {
          const formGroups = component.find('.form-group');
          formGroups.length.should.equal(3);
          formGroups[1].hasClass('has-error').should.be.true();
          formGroups[2].hasClass('has-error').should.be.true();
        }));

    it('removes .has-error once the passwords match', () =>
      mockHttp()
        .mount(AccountEditPassword)
        .request(component => submitPasswords(component, { match: false })
          .then(() => submitPasswords(component, { match: true })))
        .beforeAnyResponse(component => {
          const formGroups = component.find('.form-group');
          formGroups[1].hasClass('has-error').should.be.false();
          formGroups[2].hasClass('has-error').should.be.false();
        })
        .respondWithSuccess());
  });
});
