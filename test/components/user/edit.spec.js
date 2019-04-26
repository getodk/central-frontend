import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

describe('AccountEdit', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/account/edit')
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/account/edit').then(app => {
        app.vm.$route.path.should.equal('/account/edit');
      }));

    it('does not redirect a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit').then(app => {
        app.vm.$route.path.should.equal('/account/edit');
      });
    });
  });

  it('navigates to AccountEdit after user clicks "Edit Profile" in navbar', () =>
    mockRouteThroughLogin('/system/backups', { attachToDocument: true })
      .respondWithProblem(404.1)
      .afterResponse(app => {
        const toggle = app.first('.navbar-right .dropdown-toggle');
        $(toggle.element).click();
        return app.vm.$nextTick().then(() => app);
      })
      .then(app => trigger.click(app, '#navbar-edit-profile-action'))
      .then(app => {
        app.vm.$route.path.should.equal('/account/edit');
      }));
});
