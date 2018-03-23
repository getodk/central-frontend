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
import UserResetPassword from '../../../lib/components/user/reset-password.vue';
import mockHttp from '../../http';
import { logOut, mockLogin, mockUser } from '../../session';
import { trigger } from '../../util';

const openModal = (wrapper) => {
  const table = wrapper.first('#user-list-table');
  return trigger.click(table.first('.dropdown-toggle'))
    .then(() => trigger.click(table.first('.dropdown-menu a')))
    .then(() => wrapper);
};
const confirmResetPassword = (wrapper) =>
  trigger.click(wrapper.first('#user-reset-password-button'))
    .then(() => wrapper);

describe('UserResetPassword', () => {
  before(mockLogin);
  after(logOut);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData([mockUser()])
        .afterResponse(page => {
          page.first(UserResetPassword).getProp('state').should.be.false();
        }));

    it('opens after button click', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData([mockUser()])
        .afterResponse(openModal)
        .then(page => {
          page.first(UserResetPassword).getProp('state').should.be.true();
        }));
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserResetPassword, { propsData: { user: mockUser() } })
      .request(confirmResetPassword)
      .standardButton('#user-reset-password-button'));

  describe('after successful response', () => {
    let page;
    beforeEach(() => mockHttp()
      .mount(UserList)
      .respondWithData([mockUser()])
      .afterResponse(component => {
        page = component;
      })
      .request(() => openModal(page).then(confirmResetPassword))
      .respondWithSuccess());

    it('modal hides', () => {
      page.first(UserResetPassword).getProp('state').should.be.false();
    });

    it('success message is shown', () => {
      const alert = page.first(Alert);
      alert.getProp('state').should.be.true();
      alert.getProp('type').should.equal('success');
    });
  });
});
