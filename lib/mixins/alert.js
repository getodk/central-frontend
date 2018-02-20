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

/*
This mixin is used to manage alerts. The including component must define the
following property in data():

  - alert. An object with the following properties:

    - state. true if the alert is visible and false if not.
    - type. The alert's "contextual" type: success, info, warning, or danger.
    - message. The message to display.

    Most components will initialize this.alert as alert.blank().
*/

const factories = {};
factories.blank = (type = 'danger') => ({
  state: false,
  type,
  message: null,
  at: new Date()
});

const factory = (type) => (message) => ({
  state: true,
  type,
  message,
  at: new Date()
});
const TYPES = ['success', 'info', 'warning', 'danger'];
for (const type of TYPES)
  factories[type] = factory(type);

const mixinFactory = () => ({
  created() {
    if (this.$alert != null) {
      this.alert = this.$alert;
      this.$alert = null;
    }
  }
});

Object.assign(mixinFactory, factories);

export default mixinFactory;
