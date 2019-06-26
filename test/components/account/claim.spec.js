import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';
import { submitForm } from '../../event';

const LOCATION = { path: '/account/claim', query: { token: 'a'.repeat(64) } };

describe('AccountClaim', () => {
  describe('routing', () => {
    it('redirects if the user logs in, then navigates to /account-claim', () =>
      mockRouteThroughLogin('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .complete()
        .route(LOCATION)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });

  it('focuses the input', () =>
    mockRoute(LOCATION, { attachToDocument: true })
      .then(app => app.first('input[type="password"]').should.be.focused()));

  it('implements some standard button things', () =>
    // We need mockRoute() and not just mockHttp(), because the token is taken
    // from the URL.
    mockRoute(LOCATION)
      .complete()
      .request(app => submitForm(app, '#account-claim form', [
        ['input[type="password"]', 'password']
      ]))
      .standardButton());

  it('shows a custom alert for a 401.2 problem', () =>
    mockRoute(LOCATION)
      .request(app => submitForm(app, '#account-claim form', [
        ['input[type="password"]', 'password']
      ]))
      .respondWithProblem(() => ({
        code: 401.2,
        message: 'AccountClaim problem.'
      }))
      .afterResponse(app => {
        app.should.alert('danger', 'AccountClaim problem. The link in your email may have expired, and a new email may have to be sent.');
      }));

  describe('after a successful response', () => {
    let app;
    beforeEach(() => mockRoute(LOCATION)
      .complete()
      .request(component => {
        app = component;
        return submitForm(app, '#account-claim form', [
          ['input[type="password"]', 'password']
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
