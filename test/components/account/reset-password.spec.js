import testData from '../../data';
import { fillForm, trigger } from '../../util';
import { mockRoute } from '../../http';

const submitForm = (wrapper) => {
  const { email } = testData.administrators.createPast(1).last();
  return fillForm(wrapper, [['#account-reset-password input[type="email"]', email]])
    .then(() => trigger.submit(wrapper.first('#account-reset-password form')))
    .then(() => wrapper);
};

describe('AccountResetPassword', () => {
  it('field is focused', () =>
    // We need mockRoute() and not just mockHttp(), because AccountResetPassword
    // uses $route at render.
    mockRoute('/reset-password', { attachToDocument: true }).then(app => {
      const field = app.first('#account-reset-password input[type="email"]');
      field.should.be.focused();
    }));

  it('standard button thinking things', () =>
    mockRoute('/reset-password')
      .complete()
      .request(submitForm)
      .standardButton());

  describe('successful response', () => {
    let app;
    beforeEach(() => mockRoute('/reset-password')
      .complete()
      .request(component => {
        app = component;
        submitForm(app);
      })
      .respondWithSuccess());

    it('redirects to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success message', () => app.should.alert('success'));
  });

  it('clicking cancel navigates to login', () =>
    mockRoute('/reset-password')
      .then(app => trigger.click(app.first('.panel-footer .btn-link'))
        .then(() => app.vm.$route.path.should.equal('/login'))));
});
