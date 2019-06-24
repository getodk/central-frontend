import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin, submitLoginForm } from '../../session';
import { trigger } from '../../event';

describe('AccountLogin', () => {
  describe('routing', () => {
    it('redirects to /login if anonymous user navigates to /account/edit', () =>
      mockRoute('/account/edit')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('does not redirect if user navigates to /account-edit, then session is restored', () =>
      mockRoute('/account/edit')
        .restoreSession(true)
        .respondWithData(() => testData.standardUsers.first())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));

    it('redirects to / if the user logs in, then navigates to /login', () =>
      mockRouteThroughLogin('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .complete()
        .route('/login')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('redirects to / if user navigates to /login, then session is restored', () =>
      mockRoute('/login')
        .restoreSession(true)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });

  it('changes the next query parameter after .navbar-brand is clicked', () =>
    mockRoute('/login')
      .restoreSession(false)
      .afterResponse(app => trigger.click(app, '.navbar-brand'))
      .then(app => {
        app.vm.$route.fullPath.should.equal('/login?next=%2F');
      }));

  it('focuses the first input', () =>
    mockRoute('/login', { attachToDocument: true })
      .restoreSession(false)
      .afterResponse(app => {
        app.first('#account-login input[type="email"]').should.be.focused();
      }));

  it('implements some standard button things', () =>
    mockRoute('/login')
      .restoreSession(false)
      .complete()
      .request(app => submitLoginForm(app, 'test@email.com'))
      .standardButton());

  it('shows a danger alert for incorrect credentials', () =>
    mockRoute('/login')
      .restoreSession(false)
      .complete()
      .request(app => submitLoginForm(app, 'test@email.com'))
      .respondWithProblem(401.2)
      .afterResponse(app => {
        app.should.alert('danger', 'Incorrect email address and/or password.');
      }));

  it('navigates to /reset-password after reset password button is clicked', () =>
    mockRoute('/login')
      .restoreSession(false)
      .afterResponses(app => trigger.click(app, '.panel-footer .btn-link'))
      .then(app => {
        app.vm.$route.path.should.equal('/reset-password');
      }));
});
