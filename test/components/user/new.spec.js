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
import Vue from 'vue';
import { mount } from 'avoriaz';

import '../../setup';
import Alert from '../../../lib/components/alert.vue';
import UserList from '../../../lib/components/user/list.vue';
import UserNew from '../../../lib/components/user/new.vue';
import mockHttp from '../../http';
import { detachFromDocument, fillForm, mockRoute } from '../../util';
import { mockLogin, mockUser, resetSession } from '../../session';

const submitForm = (wrapper) => {
  fillForm(wrapper, { '#user-new-email': 'new-user@test.com' });
  wrapper.first('#user-new form').trigger('submit');
  return Vue.nextTick();
};

describe('UserNew', () => {
  before(mockLogin);
  after(resetSession);

  describe('modal', () => {
    it('is initially hidden', () => {
      const page = mount(UserList);
      page.first(UserNew).getProp('state').should.be.false();
    });

    describe('after button click', () => {
      it('modal is shown', () => {
        const page = mount(UserList);
        page.first('#user-list-new-button').trigger('click');
        return Vue.nextTick().then(() => {
          page.first(UserNew).getProp('state').should.be.true();
        });
      });

      it('first field is focused', () =>
        mockRoute('/users', { attachToDocument: true })
          .then(app => {
            app.first('#user-list-new-button').trigger('click');
            return Vue.nextTick().then(() => app);
          })
          .then(app => {
            const field = app.first('#user-new-email');
            const isFocused = document.activeElement === field.element;
            detachFromDocument(app);
            isFocused.should.be.true();
          }));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserNew)
      .request(modal => submitForm(modal))
      .standardButton('button[type="submit"]'));

  describe('after submit', () => {
    let page;
    const currentUser = { id: 1, email: mockUser().email };
    const newUser = { id: 2, email: 'new-user@test.com' };

    beforeEach(() => mockHttp()
      .request(() => {
        page = mount(UserList);
      })
      .respondWithData([currentUser])
      .point());

    beforeEach(() => {
      page.first('#user-list-new-button').trigger('click');
      return Vue.nextTick();
    });

    beforeEach(() => mockHttp()
      .request(() => submitForm(page))
      .respondWithData(newUser)
      .respondWithData([currentUser, newUser])
      .point());

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
