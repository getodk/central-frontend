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
import AccountClaim from '../../../lib/components/account/claim.vue';
import Alert from '../../../lib/components/alert.vue';
import { fillForm, mockRoute, trigger } from '../../util';

const LOCATION = { path: '/account/claim', query: { token: 'a'.repeat(64) } };
const submitForm = (wrapper) =>
  fillForm(wrapper, [['#account-claim input[type="password"]', 'password']])
    .then(() => trigger.submit(wrapper.first('#account-claim form')))
    .then(() => wrapper);

describe('AccountClaim', () => {
  it('field is focused', () => {
    const page = mount(AccountClaim, { attachToDocument: true });
    const field = page.first('input[type="password"]');
    (document.activeElement === field.element).should.be.true();
  });

  it('standard button thinking things', () =>
    // We need mockRoute() and not just mockHttp(), because the token is taken
    // from the URL.
    mockRoute(LOCATION)
      .complete()
      .request(submitForm)
      .standardButton());

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute(LOCATION)
      .complete()
      .request(submitForm)
      .respondWithSuccess()
      .afterResponse(component => {
        app = component;
      }));

    it('user is redirected to login', () => {
      app.vm.$route.path.should.equal('/login');
    });

    it('success message is shown', () => {
      const alert = app.first(Alert);
      alert.getProp('state').should.be.true();
      alert.getProp('type').should.equal('success');
    });
  });
});
