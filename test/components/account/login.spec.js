import Navbar from '../../../lib/components/navbar.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockRouteThroughLogin, submitLoginForm } from '../../session';
import { trigger } from '../../util';

describe('AccountLogin', () => {
  describe('user is logged out, and their session is not restored', () => {
    it('changes next query parameter after .navbar-brand is clicked', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponse(app => trigger.click(app, '.navbar-brand'))
        .then(app => {
          app.vm.$route.fullPath.should.equal('/login?next=%2F');
        }));

    it('does not show the navbar links', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponse(app => {
          app.find('#navbar-links').should.be.empty();
        }));

    it('indicates in the navbar that the user is logged out', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponse(app => {
          const link = app.first('.navbar-right > li > a');
          link.text().trim().should.equal('Not logged in');
        }));

    it('focuses the first field of the login form', () =>
      mockRoute('/login', { attachToDocument: true })
        .restoreSession(false)
        .afterResponse(app => {
          app.first('#account-login input[type="email"]').should.be.focused();
        }));

    it('implements some standard button things for the login form', () =>
      mockRoute('/login')
        .restoreSession(false)
        .complete()
        .request(app => submitLoginForm(app, 'test@email.com'))
        .standardButton());

    it('incorrect credentials result in error message', () =>
      mockRoute('/login')
        .restoreSession(false)
        .complete()
        .request(app => submitLoginForm(app, 'test@email.com'))
        .respondWithProblem(401.2)
        .afterResponse(app => {
          app.should.alert('danger', 'Incorrect email address and/or password.');
        }));

    it('clicking the reset password button navigates to that route', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponses(app => trigger.click(app, '.panel-footer .btn-link'))
        .then(app => {
          app.vm.$route.path.should.equal('/reset-password');
        }));
  });

  describe('after a login through the login page', () => {
    it("displays the user's display name in the navbar", () =>
      mockRouteThroughLogin('/account/edit').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal(testData.extendedUsers.first().displayName);
      }));

    describe("after clicking the user's display name", () => {
      let app;
      beforeEach(() =>
        mockRouteThroughLogin(
          '/account/edit',
          // We need to attach the component to the document, because some of
          // Bootstrap's dropdown event handlers are on the document.
          { attachToDocument: true },
          { role: 'none' }
        )
          .then(component => {
            app = component;
            const toggle = app.first('.navbar-right .dropdown-toggle');
            // Using $(...).click() rather than `trigger`, because `trigger`
            // only triggers Vue event handlers, not jQuery ones (I think). (Or
            // is it needed because the events that `trigger` creates do not
            // bubble?)
            $(toggle.element).click();
            return app.vm.$nextTick();
          }));

      it('shows a menu', () => {
        app.first('.navbar-right .dropdown').hasClass('open').should.be.true();
      });

      describe('after clicking logout button', () => {
        beforeEach(() => mockHttp()
          .request(() => trigger.click(app, '#navbar-log-out-action'))
          .respondWithProblem());

        it('user is logged out', () => {
          app.vm.$store.getters.loggedOut.should.be.true();
        });

        it('user is redirected to login', () => {
          app.vm.$route.path.should.equal('/login');
        });

        it('success message is shown', () => {
          app.should.alert('success', 'You have logged out successfully.');
        });
      });
    });
  });

  describe('navigation to /login', () => {
    it('redirects to the root page after a login through the login page', () =>
      mockRouteThroughLogin('/account/edit')
        .complete()
        .route('/login')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('redirects to the root page if the session is restored', () =>
      mockRoute('/login')
        .restoreSession(true)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));
  });

  describe('after session restore', () => {
    it('does not redirect other pages to the login page', () =>
      mockRoute('/account/edit')
        .restoreSession(true)
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));

    it('does not show the navbar until the first confirmed navigation', () =>
      mockRoute('/login')
        .beforeEachNav(app => {
          app.first(Navbar).vm.$el.style.display.should.equal('none');
        })
        .restoreSession(true)
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => {
          app.first(Navbar).vm.$el.style.display.should.equal('');
        }));
  });
});
