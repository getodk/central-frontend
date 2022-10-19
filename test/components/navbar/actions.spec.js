import sinon from 'sinon';

import Navbar from '../../../src/components/navbar.vue';
import NavbarActions from '../../../src/components/navbar/actions.vue';

import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

describe('NavbarActions', () => {
  it('indicates if the user is not logged in', () => {
    const navbar = mount(Navbar, {
      container: { router: mockRouter('/login') },
      global: {
        // Stubbing AnalyticsIntroduction because of its custom <router-link>
        stubs: { AnalyticsIntroduction: true }
      }
    });
    const text = navbar.getComponent(NavbarActions).get('a').text();
    text.should.equal('Not logged in');
  });

  it("shows the user's display name", () => {
    mockLogin({ displayName: 'Alice' });
    const navbar = mount(Navbar, {
      container: { router: mockRouter('/') },
      global: {
        stubs: { AnalyticsIntroduction: true }
      }
    });
    navbar.getComponent(NavbarActions).get('a').text().should.equal('Alice');
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
          app.vm.$container.requestData.session.dataExists.should.be.false();
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
