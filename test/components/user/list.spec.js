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
import { mount } from 'avoriaz';

import '../../setup';
import UserList from '../../../lib/components/user/list.vue';
import mockHttp from '../../http';
import { mockLogin, mockSession, mockUser, resetSession } from '../../session';
import { mockRoute } from '../../util';

describe('UserList', () => {
  describe('routing', () => {
    describe('anonymous users', () => {
      it('are redirected to login', () =>
        mockRoute('/users')
          .then(app => app.vm.$route.path.should.equal('/login')));

      it('return after login', () =>
        mockRoute('/users')
          .then(app => mockHttp()
            .request(() => {
              const element = app.vm.$el;
              const email = element.querySelector('#session-login-email');
              const password = element.querySelector('#session-login-password');
              email.value = mockUser().email;
              password.value = 'password';
              app.first('#session-login-form').trigger('submit');
            })
            .respondWithData(mockSession())
            .respondWithData(mockUser())
            .afterResponses(() => app.vm.$route.path.should.equal('/users'))));
    });
  });

  describe('after login', () => {
    before(mockLogin);
    after(resetSession);

    describe('page defaults to Staff tab', () => {
      it('tab is active', () => {
        const tab = mount(UserList).first('.nav-tabs > .active');
        const link = tab.first('a');
        link.text().trim().should.equal('Staff');
      });

      it('tab panel is active', () => {
        const panel = mount(UserList).first('.tab-content > .active');
        panel.is('#user-list-staff').should.be.true();
      });
    });

    it('table is sorted correctly', () => {
      const users = [
        { id: 1, email: mockUser().email },
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
          const tr = page.find('table > tbody > tr');
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
