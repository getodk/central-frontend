/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { shallowReactive } from 'vue';

// Tracks which modal is currently open.
class OpenModal {
  constructor() {
    this.state = false;
    this.el = null;
  }

  // Updates the data after a modal is shown.
  shown(el) { Object.assign(this, { state: true, el }); }
  // Updates the data after a modal is hidden.
  hidden() { Object.assign(this, { state: false, el: null }); }
}

export default () => shallowReactive(new OpenModal());
