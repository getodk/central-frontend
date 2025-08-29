import sinon from 'sinon';

import NavbarActions from '../../../src/components/navbar/actions.vue';

import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('NavbarActions', () => {
  it('indicates if the user is not logged in', () =>
    load('/login')
      .restoreSession(false)
      .afterResponses(app => {
        const text = app.getComponent(NavbarActions).get('a').text();
        text.should.equal('Not logged in');
      }));

  it.skip("shows the user's display name", async () => {
    mockLogin({ displayName: 'Alice Allison' });
    const app = await load('/');
    const a = app.getComponent(NavbarActions).get('a');
    a.text().should.equal('Alice Allison');
    await a.get('span:nth-child(2)').should.have.textTooltip();
  });

  describe('after the user clicks "Log out"', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
    });

    it('logs out', () =>
      load('/account/edit')
        .complete()
        .request(app => app.get('#navbar-actions-log-out').trigger('click'))
        .respondWithSuccess()
        .afterResponse(app => {
          app.vm.$container.requestData.session.dataExists.should.be.false;
        }));

    it('does not set the ?next query parameter', () =>
      load('/account/edit')
        .complete()
        .request(app => app.get('#navbar-actions-log-out').trigger('click'))
        .respondWithSuccess()
        .afterResponse(app => {
          app.vm.$route.fullPath.should.equal('/login');
        }));

    it('shows a success alert', () =>
      load('/account/edit')
        .complete()
        .request(app => app.get('#navbar-actions-log-out').trigger('click'))
        .respondWithSuccess()
        .afterResponse(app => {
          app.should.alert('success', 'You have logged out successfully.');
        }));

    it('does not log out if the user does not confirm unsaved changes', () => {
      sinon.replace(window, 'confirm', () => false);
      return load('/account/edit')
        .afterResponses(app => {
          app.vm.$container.unsavedChanges.plus(1);
        })
        .testNoRequest(app =>
          app.get('#navbar-actions-log-out').trigger('click'));
    });
  });
});
