import testData from '../../data';
import { mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../http';

describe('UserEdit', () => {
  describe('routing to /account/edit', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/account/edit')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/account/edit')
        .respondWithData(() => testData.standardUsers.last())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/account/edit');
        }));

    it('does not redirect a user with minimal grants', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.last())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/account/edit');
        });
    });
  });

  describe('routing to /users/:id/edit', () => {
    it('redirects an anonymous user to login', () =>
      mockRoute('/users/2/edit')
        .restoreSession(false)
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/login');
        }));

    it('redirects the user back after login', () =>
      mockRouteThroughLogin('/users/2/edit')
        .respondWithData(() => testData.standardUsers.createPast(1).last())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users/2/edit');
        }));

    it('redirects a user without a grant to user.read', () => {
      mockLogin({ verbs: ['project.list', 'user.update'] });
      return mockRoute('/users/2/edit')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('redirects a user without a grant to user.update', () => {
      mockLogin({ verbs: ['project.list', 'user.read'] });
      return mockRoute('/users/2/edit')
        .respondWithData(() =>
          testData.extendedProjects.createPast(1).sorted())
        .afterResponses(app => {
          app.vm.$route.path.should.equal('/');
        });
    });
  });
});
