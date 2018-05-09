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
import UserNew from '../../../lib/components/user/new.vue';
import mockHttp from '../../http';
import testData from '../../data';
import { fillForm, mockRoute, trigger } from '../../util';
import { mockLogin } from '../../session';

const clickCreateButton = (wrapper) =>
  trigger('click', wrapper.first('#user-list-new-button')).then(() => wrapper);
const submitForm = (wrapper) =>
  fillForm(wrapper, [['[type="email"]', testData.administrators.createNew().email]])
    .then(() => trigger('submit', wrapper.first('#user-new form')))
    .then(() => wrapper);

describe('UserNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(UserList)
        .respondWithData(() => testData.administrators.sorted())
        .afterResponse(page => {
          page.first(UserNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
        mockHttp()
          .mount(UserList)
          .respondWithData(() => testData.administrators.sorted())
          .afterResponse(clickCreateButton)
          .then(page => page.first(UserNew).getProp('state').should.be.true()));

      it('first field is focused', () =>
        mockRoute('/users', { attachToDocument: true })
          .respondWithData(() => testData.administrators.sorted())
          .afterResponse(clickCreateButton)
          .then(app => app.first('[type="email"]').should.be.focused()));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(UserNew)
      .request(submitForm)
      .standardButton());

  describe('after successful submit', () => {
    let page;
    beforeEach(() => mockHttp()
      .mount(UserList)
      .respondWithData(() => testData.administrators.sorted())
      .afterResponse(component => {
        page = component;
      })
      .request(() => clickCreateButton(page).then(submitForm))
      .respondWithData(() => testData.administrators.last())
      .respondWithData(() => testData.administrators.sorted()));

    it('modal is hidden', () => {
      page.first(UserNew).getProp('state').should.be.false();
    });

    it('table has the correct number of rows', () => {
      page.find('table tbody tr').length.should.equal(2);
    });

    it('success message is shown', () => {
      page.should.alert('success');
    });
  });
});
