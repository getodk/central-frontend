import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';
import { submitForm, trigger } from '../../event';

describe('AccountResetPassword', () => {
  it('field is focused', () =>
    // We need mockRoute() and not just mockHttp(), because AccountResetPassword
    // uses $route at render.
    mockRoute('/reset-password', { attachToDocument: true })
      .restoreSession(false)
      .afterResponse(app => {
        const field = app.first('#account-reset-password input[type="email"]');
        field.should.be.focused();
      }));

  it('standard button thinking things', () =>
    mockRoute('/reset-password')
      .restoreSession(false)
      .complete()
      .request(app => submitForm(app, '#account-reset-password form', [
        ['input[type="email"]', testData.administrators.createPast(1).last().email]
      ]))
      .standardButton());

  describe('successful response', () => {
    let app;
    beforeEach(() => mockRoute('/reset-password')
      .restoreSession(false)
      .complete()
      .request(component => {
        app = component;
        return submitForm(app, '#account-reset-password form', [
          ['input[type="email"]', testData.administrators.createPast(1).last().email]
        ]);
      })
      .respondWithSuccess());

    it('redirects to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success message', () => {
      app.should.alert('success');
    });
  });

  it('clicking cancel navigates to login', () =>
    mockRoute('/reset-password')
      .restoreSession(false)
      .afterResponse(app => trigger.click(app.first('.panel-footer .btn-link'))
        .then(() => app.vm.$route.path.should.equal('/login'))));

  describe('navigation to /reset-password', () => {
    it('redirects to the root page after a login through the login page', () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.administrators.sorted())
        .complete()
        .route('/reset-password')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('redirects to the root page if the session is restored', () =>
      mockRoute('/reset-password')
        .restoreSession(true)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });
});
