import sinon from 'sinon';

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

  describe('after the user clicks "Log out"', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
    });

    it('logs out', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-actions-log-out'))
        .respondWithSuccess()
        .afterResponse(app => {
          should.not.exist(app.vm.$store.state.request.data.session);
        }));

    it('does not set the ?next query parameter', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-actions-log-out'))
        .respondWithSuccess()
        .afterResponse(app => {
          app.vm.$route.fullPath.should.equal('/login');
        }));

    it('shows a success alert', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-actions-log-out'))
        .respondWithSuccess()
        .afterResponse(app => {
          app.should.alert('success', 'You have logged out successfully.');
        }));

    it('does not log out if the user does not confirm unsaved changes', () => {
      sinon.replace(window, 'confirm', () => false);
      return load('/account/edit')
        .afterResponses(app => {
          app.vm.$store.commit('setUnsavedChanges', true);
        })
        .testNoRequest(trigger.click('#navbar-actions-log-out'));
    });
  });
});
