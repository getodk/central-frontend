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
import FormDelete from '../../../lib/components/form/delete.vue';
import FormSettings from '../../../lib/components/form/settings.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../util';

const clickDeleteButton = (wrapper) =>
  trigger.click(wrapper.first('#form-settings .panel-simple-danger .btn-danger'))
    .then(() => wrapper);
const confirmDelete = (wrapper) =>
  trigger.click(wrapper.first('#form-delete .btn-danger'))
    .then(() => wrapper);

describe('FormDelete', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () => {
    const propsData = { form: testData.simpleForms.createPast(1).last() };
    const page = mountAndMark(FormSettings, { propsData });
    page.first(FormDelete).getProp('state').should.be.false();
    return clickDeleteButton(page)
      .then(() => page.first(FormDelete).getProp('state').should.be.true());
  });

  it('standard button thinking things', () => {
    const propsData = { form: testData.simpleForms.createPast(1).last() };
    return mockHttp()
      .mount(FormDelete, { propsData })
      .request(confirmDelete)
      .standardButton('.btn-danger');
  });

  describe('after successful response', () => {
    let app;
    beforeEach(() => {
      testData.extendedForms.createPast(2);
      const { xmlFormId } = testData.extendedForms.first();
      return mockRoute(`/forms/${xmlFormId}/settings`)
        .respondWithData(() => testData.simpleForms.first())
        .afterResponse(component => {
          app = component;
          return clickDeleteButton(app);
        })
        .request(() => {
          testData.extendedForms.splice(0, 1);
          return confirmDelete(app);
        })
        .respondWithSuccess()
        .respondWithData(() => testData.extendedForms.sorted());
    });

    it('redirects user to form list', () => {
      app.vm.$route.path.should.equal('/forms');
    });

    it('shows a success message', () => {
      app.should.alert('success');
    });
  });
});
