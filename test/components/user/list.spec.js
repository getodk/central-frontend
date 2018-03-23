/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Alert from '../../../lib/components/alert.vue';
import UserList from '../../../lib/components/user/list.vue';
import mockHttp from '../../http';
import { logOut, mockLogin, mockRouteThroughLogin, mockUser } from '../../session';
import { mockRoute } from '../../util';

describe('UserList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/users')
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/users')
        .respondWithData([mockUser()])
        .afterResponses(app => app.vm.$route.path.should.equal('/users')));
  });

  it('success message is shown after login', () =>
    mockRouteThroughLogin('/users')
      .respondWithData([mockUser()])
      .afterResponse(app => {
        const alert = app.first(Alert);
        alert.getProp('state').should.be.true();
        alert.getProp('type').should.equal('success');
      })
      .finally(logOut));

  describe('after login', () => {
    before(mockLogin);
    after(logOut);

    it('page defaults to the Staff tab', () =>
      mockRoute('/users')
        .respondWithData([mockUser()])
        .afterResponse(app => {
          const tab = app.first('.nav-tabs > .active');
          const title = tab.first('a').text().trim();
          title.should.equal('Staff');
        }));

    it('table is sorted correctly', () => {
      const users = [
        mockUser(),
        { id: 2, email: 'user2@test.com' }
      ];
      users.sort((a, b) => {
        if (a.email < b.email)
          return -1;
        else if (a.email > b.email)
          return 1;
        return 0;
      });
      return mockHttp()
        .mount(UserList)
        .respondWithData(users)
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
  });
});
