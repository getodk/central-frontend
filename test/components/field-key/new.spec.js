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
import FieldKeyList from '../../../lib/components/field-key/list.vue';
import FieldKeyNew from '../../../lib/components/field-key/new.vue';
import mockHttp from '../../http';
import testData from '../../data';
import { fillForm, mockRoute, trigger } from '../../util';
import { mockLogin } from '../../session';

const clickCreateButton = (wrapper) =>
  trigger.click(wrapper.first('#field-key-list-new-button'))
    .then(() => wrapper);
const submitForm = (wrapper) => {
  const nickname = testData.extendedFieldKeys.createNew().displayName;
  return fillForm(wrapper, [['#field-key-new input', nickname]])
    .then(() => trigger.submit(wrapper.first('#field-key-new form')))
    .then(() => wrapper);
};

describe('FieldKeyNew', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(FieldKeyList)
        .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
        .afterResponse(page => {
          page.first(FieldKeyNew).getProp('state').should.be.false();
        }));

    describe('after button click', () => {
      it('modal is shown', () =>
        mockHttp()
          .mount(FieldKeyList)
          .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
          .afterResponse(clickCreateButton)
          .then(page => page.first(FieldKeyNew).getProp('state').should.be.true()));

      it('first field is focused', () =>
        mockRoute('/users/field-keys', { attachToDocument: true })
          .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
          .afterResponse(clickCreateButton)
          .then(app => {
            app.first('#field-key-new input').should.be.focused();
          }));
    });
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(FieldKeyNew)
      .request(submitForm)
      .standardButton());

  describe('after successful submit', () => {
    let page;
    beforeEach(() => mockHttp()
      .mount(FieldKeyList)
      .respondWithData(() => testData.extendedFieldKeys.createPast(1).sorted())
      .afterResponse(component => {
        page = component;
      })
      .request(() => clickCreateButton(page).then(submitForm))
      .respondWithData(() => testData.simpleFieldKeys.last())
      .respondWithData(() => testData.extendedFieldKeys.sorted()));

    it('modal is hidden', () => {
      page.first(FieldKeyNew).getProp('state').should.be.false();
    });

    it('table has the correct number of rows', () => {
      page.find('table tbody tr').length.should.equal(2);
    });

    it('success message is shown', () => {
      page.should.alert('success');
    });
  });
});
