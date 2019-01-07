import UserList from '../../../lib/components/user/list.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin, mockRouteThroughLogin } from '../../session';

describe('UserList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/users')
        .restoreSession(false)
        .afterResponse(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(app => app.vm.$route.path.should.equal('/users')));
  });

  describe('after login', () => {
    beforeEach(mockLogin);

    it('table contains the correct data', () => {
      const users = testData.administrators.createPast(1).sorted();
      return mockHttp()
        .mount(UserList)
        .respondWithData(() => users)
        .afterResponse(page => {
          const tr = page.find('table tbody tr');
          tr.length.should.equal(2);
          for (let i = 0; i < tr.length; i += 1) {
            const td = tr[i].find('td');
            td.length.should.equal(3);
            td[0].text().should.equal(users[i].email);
            td[1].text().should.equal('Yes');
          }
        });
    });

    it('refreshes after the refresh button is clicked', () =>
      mockRoute('/users')
        .testRefreshButton({ collection: testData.administrators }));
  });
});
