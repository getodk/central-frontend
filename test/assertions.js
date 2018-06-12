/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import should from 'should';

import Alert from '../lib/components/alert.vue';

should.Assertion.add('focused', function focused() {
  this.params = { operator: 'to be focused' };
  // If this.obj is an avoriaz wrapper, extract its element.
  const element = this.obj.element != null ? this.obj.element : this.obj;
  element.should.equal(document.activeElement);
});

should.Assertion.add('alert', function assertAlert(type = null, message = null) {
  const alert = this.obj.first(Alert);
  alert.getProp('state').should.be.true();
  if (type != null) alert.getProp('type').should.equal(type);
  if (message != null) alert.getProp('message').should.equal(message);
});
