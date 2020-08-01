import testData from '../../data';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('NavbarLinks', () => {
  it('does not render the navbar links before login', () =>
    mockRoute('/login')
      .restoreSession(false)
      .afterResponse(app => {
        app.find('#navbar-links').length.should.equal(0);
      }));

  describe('navigation', () => {
    beforeEach(mockLogin);

    it('navigates to / after the user clicks the Projects link', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-links-projects'))
        .respondFor('/')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        }));

    it('navigates to /users after the user clicks the Users link', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-links-users'))
        .respondFor('/users')
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users');
        }));

    it('navigates to /system/backups after user clicks System link', () =>
      load('/account/edit')
        .complete()
        .request(trigger.click('#navbar-links-system'))
        .respondFor('/system/backups')
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/system/backups');
        }));
  });

  describe('user with no sitewide role', () => {
    beforeEach(() => {
      mockLogin({ role: 'none' });
    });

    it('shows the Projects link', () =>
      load('/account/edit').then(app => {
        app.find('#navbar-links-projects').length.should.equal(1);
      }));

    it('does not show the Users link', () =>
      load('/account/edit').then(app => {
        app.find('#navbar-links-users').length.should.equal(0);
      }));

    it('does not show the System link', () =>
      load('/account/edit').then(app => {
        app.find('#navbar-links-system').length.should.equal(0);
      }));
  });

  describe('active link', () => {
    beforeEach(mockLogin);

    const assertActiveLink = (selector) => (app) => {
      const active = app.find('#navbar-links .active');
      active.length.should.equal(1);
      active[0].find(selector).length.should.equal(1);
    };

    it('marks the Projects link as active for ProjectList', () =>
      load('/').then(assertActiveLink('#navbar-links-projects')));

    it('marks the Projects link as active for ProjectOverview', () => {
      testData.extendedProjects.createPast(1);
      return load('/projects/1')
        .then(assertActiveLink('#navbar-links-projects'));
    });

    it('marks the Users link as active for UserList', () =>
      load('/users').then(assertActiveLink('#navbar-links-users')));

    it('marks the Users link as active for UserEdit', () =>
      load('/users/1/edit').then(assertActiveLink('#navbar-links-users')));

    it('marks no link as active for AccountEdit', () =>
      load('/account/edit').then(app => {
        app.first('#navbar-links').find('.active').length.should.equal(0);
      }));

    it('marks the System link as active for BackupList', () =>
      load('/system/backups').then(assertActiveLink('#navbar-links-system')));

    it('marks the System link as active for AuditList', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'user.update',
        actee: testData.toActor(testData.extendedUsers.first())
      });
      return load('/system/audits')
        .then(assertActiveLink('#navbar-links-system'));
    });
  });
});
