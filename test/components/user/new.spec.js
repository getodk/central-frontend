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
import Alert from '../../../lib/components/alert.vue';
import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import mockHttp from '../../http';
import { fillForm, mockRoute, trigger } from '../../util';
import { mockLogin, mockUser, resetSession } from '../../session';

const clickCreateButton = (wrapper) =>
  trigger('click', wrapper.first('#user-list-new-button')).then(() => wrapper);
const submitForm = (wrapper) =>
  fillForm(wrapper, [['#user-new-email', 'new-user@test.com']])
    .then(() => trigger('submit', wrapper.first('#user-new form')))
    .then(() => wrapper);

describe('UserNew', () => {
  before(mockLogin);
  after(resetSession);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData([mockUser()])
        .afterResponse(page => {
          page.first(UserNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
        mockHttp()
          .mount(UserList)
          .respondWithData([mockUser()])
          .afterResponse(clickCreateButton)
          .then(page => page.first(UserNew).getProp('state').should.be.true()));

      it('first field is focused', () =>
        mockRoute('/users', { attachToDocument: true })
          .respondWithData([mockUser()])
          .afterResponse(clickCreateButton)
          .then(app => {
            const field = app.first('#user-new-email');
            (document.activeElement === field.element).should.be.true();
          }));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserNew)
      .request(submitForm)
      .standardButton('button[type="submit"]'));

  describe('after successful submit', () => {
    let page;
    const newUser = { id: 2, email: 'new-user@test.com' };

    beforeEach(() => mockHttp()
      .request(() => {
        page = mount(UserList);
      })
      .respondWithData([mockUser()])
      .complete());

    beforeEach(() => clickCreateButton(page));

    beforeEach(() => mockHttp()
      .request(() => submitForm(page))
      .respondWithData(newUser)
      .respondWithData([mockUser(), newUser])
      .complete());

    it('modal is hidden', () => {
      page.first(UserNew).getProp('state').should.be.false();
    });

    it('table has the correct number of rows', () => {
      page.find('table tbody tr').length.should.equal(2);
    });

    it('success message is shown', () => {
      const alert = page.first('#user-list-staff').first(Alert);
      alert.getProp('state').should.be.true();
      alert.getProp('type').should.equal('success');
    });
  });
});
