import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';

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
        .afterResponse(app => {
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
});
