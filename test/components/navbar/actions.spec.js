import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('NavbarActions', () => {
  it('indicates if the user is not logged in', () =>
    load('/login')
      .restoreSession(false)
      .afterResponses(app => {
        const text = app.first('#navbar-actions > a').text().trim();
        text.should.equal('Not logged in');
      }));

  it("shows the user's display name", () => {
    mockLogin({ displayName: 'Alice' });
    return load('/account/edit').then(app => {
      app.first('#navbar-actions > a').text().trim().should.equal('Alice');
    });
  });

  it('navigates to /account/edit after the user clicks "Edit profile"', () => {
    mockLogin();
    return load('/system/backups', { attachToDocument: true }, {})
      .complete()
      .request(app => {
        const toggle = app.first('.navbar-right .dropdown-toggle');
        $(toggle.element).click();
        return app.vm.$nextTick()
          .then(() => trigger.click(app, '#navbar-actions-edit-profile'));
      })
      .respondFor('/account/edit')
      .afterResponses(app => {
        app.vm.$route.path.should.equal('/account/edit');
      });
  });

  describe('logging out', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
    });

    // We need to attach the component to the document, because some of
    // Bootstrap's dropdown event handlers are on the document.
    const logOut = () => load('/account/edit', { attachToDocument: true }, {})
      .complete()
      .request(app => {
        const toggle = app.first('.navbar-right .dropdown-toggle');
        // Using $(...).click() rather than `trigger`, because `trigger` only
        // triggers Vue event handlers, not jQuery ones (I think). (Or is it
        // needed because the events that `trigger` creates do not bubble?)
        $(toggle.element).click();
        return app.vm.$nextTick()
          .then(() => trigger.click(app, '#navbar-actions-log-out'));
      })
      .respondWithProblem();

    it('clears the session', () =>
      logOut().then(app => {
        should.not.exist(app.vm.$store.state.request.data.session);
      }));

    it('redirects the user to /login', () =>
      logOut().then(app => {
        app.vm.$route.path.should.equal('/login');
      }));

    it('shows a success alert', () =>
      logOut().then(app => {
        app.should.alert('success', 'You have logged out successfully.');
      }));
  });
});
