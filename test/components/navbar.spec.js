import Navbar from '../../src/components/navbar.vue';
import testData from '../data';
import { mockRoute } from '../http';
import { mockRouteThroughLogin, mockLogin } from '../session';
import { trigger } from '../event';

const loadThenOpenMenu = () =>
  mockRouteThroughLogin(
    '/account/edit',
    // We need to attach the component to the document, because some of
    // Bootstrap's dropdown event handlers are on the document.
    { attachToDocument: true },
    { role: 'none' }
  )
    .respondWithData(() => testData.standardUsers.first())
    .afterResponse(app => {
      const toggle = app.first('.navbar-right .dropdown-toggle');
      // Using $(...).click() rather than `trigger`, because `trigger` only
      // triggers Vue event handlers, not jQuery ones (I think). (Or is it
      // needed because the events that `trigger` creates do not bubble?)
      $(toggle.element).click();
      return app.vm.$nextTick().then(() => app);
    });

describe('Navbar', () => {
  describe('visibility', () => {
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

    it('shows the navbar for AccountClaim', () => {
      const location = {
        path: '/account/claim',
        query: { token: 'a'.repeat(64) }
      };
      return mockRoute(location).then(app => {
        app.first(Navbar).vm.$el.style.display.should.equal('');
      });
    });
  });

  describe('routing', () => {
    beforeEach(mockLogin);

    for (const selector of ['.navbar-brand', '#navbar-projects-link']) {
      it(`navigates to ProjectList after a click on ${selector}`, () =>
        mockRoute('/account/edit')
          .respondWithData(() => testData.standardUsers.first())
          .complete()
          .request(app => trigger.click(app, selector))
          .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
          .respondWithData(() => testData.standardUsers.sorted())
          .afterResponses(app => {
            app.vm.$route.path.should.equal('/');
          }));
    }

    it('navigates to UserList after a click on the Users link', () =>
      mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .complete()
        .request(app => trigger.click(app, '#navbar-users-link'))
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users');
        }));

    it('navigates to BackupList after a click on the System link', () =>
      mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .complete()
        .request(app => trigger.click(app, '#navbar-system-link'))
        .respondWithProblem(404.1)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/system/backups');
        }));

    it('navigates to AccountEdit after a click on "Edit profile"', () =>
      mockRoute('/system/backups', { attachToDocument: true })
        .respondWithProblem(404.1)
        .complete()
        .request(app => {
          const toggle = app.first('.navbar-right .dropdown-toggle');
          $(toggle.element).click();
          return app.vm.$nextTick()
            .then(() => trigger.click(app, '#navbar-edit-profile-action'));
        })
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));
  });

  describe('grants', () => {
    it('does not show the navbar links before login', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponse(app => {
          app.find('#navbar-links').length.should.equal(0);
        }));

    it('shows the Projects link for a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.find('#navbar-projects-link').length.should.equal(1);
        });
    });

    it('shows the Users link for an administrator', () => {
      mockLogin();
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.find('#navbar-users-link').length.should.equal(1);
        });
    });

    it('does not show the Users link for a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.find('#navbar-users-link').length.should.equal(0);
        });
    });

    it('shows the System link for an administrator', () => {
      mockLogin();
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.find('#navbar-system-link').length.should.equal(1);
        });
    });

    it('does not show the System link for a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.find('#navbar-system-link').length.should.equal(0);
        });
    });
  });

  describe('active link', () => {
    beforeEach(mockLogin);

    const assertActiveLink = (selector) => (app) => {
      const active = app.first('#navbar-links').find('.active');
      active.length.should.equal(1);
      active[0].find(selector).length.should.equal(1);
    };

    it('marks the Projects link as active for ProjectList', () =>
      mockRoute('/')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .respondWithData(() => testData.standardUsers.sorted())
        .afterResponses(assertActiveLink('#navbar-projects-link')));

    it('marks the Projects link as active for ProjectOverview', () =>
      mockRoute('/projects/1')
        .respondWithData(() => testData.extendedProjects.createPast(1).last())
        .respondWithData(() => testData.extendedForms.sorted())
        .afterResponses(assertActiveLink('#navbar-projects-link')));

    it('marks the Users link as active for UserList', () =>
      mockRoute('/users')
        .respondWithData(() => testData.standardUsers.sorted())
        .respondWithData(() =>
          testData.standardUsers.sorted().map(testData.toActor))
        .afterResponses(assertActiveLink('#navbar-users-link')));

    it('marks the Users link as active for UserEdit', () =>
      mockRoute('/users/1/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(assertActiveLink('#navbar-users-link')));

    it('marks no link as active for AccountEdit', () =>
      mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          app.first('#navbar-links').find('.active').length.should.equal(0);
        }));

    it('marks the System link as active for BackupList', () =>
      mockRoute('/system/backups')
        .respondWithProblem(404.1)
        .afterResponse(assertActiveLink('#navbar-system-link')));
  });

  describe('menu', () => {
    it('indicates in the navbar if the user is logged out', () =>
      mockRoute('/login')
        .restoreSession(false)
        .afterResponse(app => {
          const link = app.first('.navbar-right > li > a');
          link.text().trim().should.equal('Not logged in');
        }));

    it("displays the user's display name in the navbar after login", () =>
      mockRouteThroughLogin('/account/edit')
        .respondWithData(() => testData.standardUsers.first())
        .afterResponse(app => {
          const link = app.first('.navbar-right > li > a');
          const user = testData.extendedUsers.first();
          link.text().trim().should.equal(user.displayName);
        }));

    it("shows the menu after the user's display name is clicked", () =>
      loadThenOpenMenu().then(app => {
        app.first('.navbar-right .dropdown').hasClass('open').should.be.true();
      }));
  });

  describe('after the log out button is clicked', () => {
    let app;
    beforeEach(() => loadThenOpenMenu()
      .request(component => {
        app = component;
        return trigger.click(app, '#navbar-log-out-action');
      })
      .respondWithProblem());

    it('logs the user out', () => {
      app.vm.$store.getters.loggedOut.should.be.true();
    });

    it('redirects the user to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success alert', () => {
      app.should.alert('success', 'You have logged out successfully.');
    });
  });
});
