import testData from '../../data';
import { mockRoute } from '../../http';
import { mockRouteThroughLogin } from '../../session';
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
  });

  it('navigates to AccountEdit after user clicks "Edit Profile" in navbar', () =>
    mockRouteThroughLogin('/users', { attachToDocument: true })
      .respondWithData(() => testData.administrators.sorted())
      .afterResponse(app => {
        $(app.element).find('.navbar .dropdown-toggle').click();
        return app.vm.$nextTick().then(() => app);
      })
      .then(app => trigger.click(app, '#navbar-edit-profile-action'))
      .then(app => app.vm.$route.path.should.equal('/account/edit')));
});
