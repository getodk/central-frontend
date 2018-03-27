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
import UserList from '../../../lib/components/user/list.vue';
import mockHttp from '../../http';
import testData from '../../data';
import { logOut, mockLogin, mockRouteThroughLogin } from '../../session';
import { mockRoute } from '../../util';

describe('UserList', () => {
  describe('routing', () => {
    it('anonymous user is redirected to login', () =>
      mockRoute('/users')
        .then(app => app.vm.$route.path.should.equal('/login')));

    it('after login, user is redirected back', () =>
      mockRouteThroughLogin('/users')
        .respondWithData(() => testData.administrators.sorted())
        .afterResponses(app => app.vm.$route.path.should.equal('/users')));
  });

  it('success message is shown after login', () =>
    mockRouteThroughLogin('/users')
      .respondWithData(() => testData.administrators.sorted())
      .afterResponse(app => app.should.alert('success'))
      .finally(logOut));

  describe('after login', () => {
    beforeEach(mockLogin);
    afterEach(logOut);

    it('page defaults to the Staff tab', () =>
      mockRoute('/users')
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(app => {
          const tab = app.first('.nav-tabs > .active');
          const title = tab.first('a').text().trim();
          title.should.equal('Staff');
        }));

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
  });
});
