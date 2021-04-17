import { mockRoute } from '../../util/http';
import { fillForm, submitForm } from '../../util/event';

const LOCATION = { path: '/account/claim', query: { token: 'a'.repeat(64) } };

describe('AccountClaim', () => {
  it('focuses the input', () =>
    mockRoute(LOCATION, { attachToDocument: true })
      .then(app => app.first('input[type="password"]').should.be.focused()));

  it('implements some standard button things', () =>
    // We need mockRoute() and not just mockHttp(), because the token is taken
    // from the URL.
    mockRoute(LOCATION)
      .complete()
      .request(app => submitForm(app, '#account-claim form', [
        ['input[type="password"]', 'testPassword'] // minimum 10 character is required
      ]))
      .standardButton());

  it('shows a custom alert for a 401.2 problem', () =>
    mockRoute(LOCATION)
      .request(app => submitForm(app, '#account-claim form', [
        ['input[type="password"]', 'testPassword']
      ]))
      .respondWithProblem({ code: 401.2, message: 'AccountClaim problem.' })
      .afterResponse(app => {
        app.should.alert('danger', 'AccountClaim problem. The link in your email may have expired, and a new email may have to be sent.');
      }));

  it('shows a alert for short password length error', () =>
    mockRoute(LOCATION)
      .request(app => submitForm(app, '#account-claim form', [
        ['input[type="password"]', 'x']
      ]))
      .afterResponse(app => {
        app.should.alert('danger', 'Please input a password at least 10 characters long.');
      }));

  it('shows full password strength', () =>
    mockRoute(LOCATION)
      .request(app => fillForm(app, [
        ['input[type="password"]', '@1TestPassword1@']
      ]))
      .afterResponse(app => {
        app.first('.Password__strength-meter--fill').getAttribute('data-score').should.equal('4');
      }));

  it('shows proper page title', () =>
    mockRoute(LOCATION)
      .then(() => document.title.should.equal('Set Password | ODK Central')));

  describe('after a successful response', () => {
    let app;
    beforeEach(() => mockRoute(LOCATION)
      .complete()
      .request(component => {
        app = component;
        return submitForm(app, '#account-claim form', [
          ['input[type="password"]', 'testPassword']
        ]);
      })
      .respondWithSuccess());

    it('redirects to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success alert', () => {
      app.should.alert('success');
    });
  });
});
