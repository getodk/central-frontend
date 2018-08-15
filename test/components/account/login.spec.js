import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockRouteThroughLogin, submitLoginForm } from '../../session';
import { trigger } from '../../util';

describe('AccountLogin', () => {
  describe('user is logged out', () => {
    it('navbar indicates that the user is logged out', () =>
      mockRoute('/login').then(app => {
        const link = app.first('.navbar-right > li > a');
        link.text().trim().should.equal('Not logged in');
      }));

    it('first field is focused', () =>
      // We need mockRoute() and not just mockHttp(), because AccountLogin uses
      // $route at render.
      mockRoute('/login', { attachToDocument: true }).then(app => {
        app.first('#account-login input[type="email"]').should.be.focused();
      }));

    it('standard button thinking things', () =>
      mockRoute('/login')
        .complete()
        .request(submitLoginForm)
        .standardButton());

    it('incorrect credentials result in error message', () =>
      mockRoute('/login')
        .complete()
        .request(submitLoginForm)
        .respondWithProblem(401.2)
        .afterResponse(app => {
          app.should.alert('danger', 'Incorrect email address and/or password.');
        }));

    it('clicking the reset password button navigates to that page', () =>
      mockRoute('/login')
        .then(app => trigger('click', app.first('.panel-footer .btn-link'))
          .then(() => app.vm.$route.path.should.equal('/reset-password'))));
  });

  describe('after login', () => {
    it('navigating to login redirects to the root page', () =>
      mockRouteThroughLogin('/users')
        .respondWithProblem()
        .complete()
        .request(app => app.vm.$router.push('/login'))
        .respondWithProblems([500, 500, 500])
        .afterResponse(app => app.vm.$route.path.should.equal('/')));

    it("navbar shows the user's display name", () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(app => {
          const link = app.first('.navbar-right > li > a');
          link.text().trim().should.equal(testData.administrators.first().displayName);
        }));

    describe("after clicking the user's display name", () => {
      let app;
      let dropdown;

      // We need to attach the component to the document, because some of
      // Bootstrap's dropdown listeners are on the document.
      beforeEach(() => mockRouteThroughLogin('/users', { attachToDocument: true })
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(component => {
          app = component;
          dropdown = app.first('.navbar-right .dropdown');
          // Have the event bubble so that it triggers Bootstrap's dropdown
          // listeners on the document.
          return trigger('click', dropdown.first('.dropdown-toggle'), true);
        }));

      it('a menu is shown', () => {
        dropdown.is('.open').should.be.true();
      });

      describe('after clicking logout button', () => {
        beforeEach(() => mockHttp()
          .request(() => {
            trigger('click', dropdown.first('.dropdown-menu > li > a'));
          })
          .respondWithProblem());

        it('user is logged out', () => {
          app.vm.$session.loggedOut().should.be.true();
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
});
