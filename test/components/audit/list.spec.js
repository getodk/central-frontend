import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';
import { trigger } from '../../event';

describe('AuditList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/system/audits')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/system/audits')
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/system/audits');
        }));

    it('navigates to AuditList after the tab is clicked', () => {
      mockLogin();
      return mockRoute('/system/backups')
        .respondWithProblem(404.1)
        .complete()
        .request(app =>
          trigger.click(app, '#page-head-tabs a[href="#/system/audits"]'))
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/system/audits');

          const activeTab = app.first('#page-head-tabs .active');
          const href = activeTab.first('a').getAttribute('href');
          href.should.equal('#/system/audits');
        });
    });
  });
});
