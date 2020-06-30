import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

describe('UserEdit', () => {
  describe('navigating to /account/edit', () => {
    it('does not redirect a user with no sitewide role', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.last())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/account/edit');
        });
    });
  });

  describe('navigating to /users/:id/edit', () => {
    it('redirects a user with no sitewide role', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/users/2/edit')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('requires id route param to be integer', () =>
      mockRoute('/users/x/edit')
        .then(app => {
          app.find(NotFound).length.should.equal(1);
        }));
  });

  describe('navigating from /account/edit to /users/:id/edit', () => {
    it('redirects a user with no sitewide role', () => {
      mockLogin({ role: 'none' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.last())
        .complete()
        .route('/users/1/edit')
        .respondWithData(() => testData.extendedProjects.createPast(1).sorted())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/');
        });
    });

    it('does not redirect an administrator', () => {
      mockLogin({ role: 'admin' });
      return mockRoute('/account/edit')
        .respondWithData(() => testData.standardUsers.last())
        .complete()
        .route('/users/1/edit')
        .respondWithData(() => testData.standardUsers.last())
        .afterResponse(app => {
          app.vm.$route.path.should.equal('/users/1/edit');
        });
    });
  });
});
