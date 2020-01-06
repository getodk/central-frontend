import BackupList from '../../../src/components/backup/list.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin, mockRouteThroughLogin } from '../../util/session';

describe('BackupList', () => {
  describe('routing', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/system/backups')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/system/backups')
        .respondWithProblem(404.1)
        .respondWithData(() => testData.standardAudits.sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/system/backups');
        }));

    it('redirects a user without a grant to config.read', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/system/backups')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('shows a table if there are audit log entries', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithProblem(404.1)
        .respondWithData(() => testData.standardAudits
          .createPast(1, { action: 'backup' })
          .sorted())
        .afterResponses(component => {
          component.find('#audit-table').length.should.equal(1);
        }));

    it('does not show a table if there are no audit log entries', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithProblem(404.1)
        .respondWithData(() => testData.standardAudits.sorted())
        .afterResponses(component => {
          component.find('#audit-table').length.should.equal(0);
        }));
  });
});
