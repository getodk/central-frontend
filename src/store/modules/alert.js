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
export default {
  state: {
    // The alert's "contextual" type: 'success', 'info', 'warning', or 'danger'.
    type: 'danger',
    message: null,
    // `true` if the alert is visible and `false` if not.
    state: false,
    // The time at which the alert was last set
    at: new Date()
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    setAlert(state, { type, message }) {
      state.type = type;
      state.message = message;
      state.state = true;
      state.at = new Date();
    },
    hideAlert(state) {
      state.state = false;
    },
    resetAlert(state, type = 'danger') {
      state.type = type;
      state.message = null;
      state.state = false;
      state.at = new Date();
    }
    /* eslint-enable no-param-reassign */
  }
};
