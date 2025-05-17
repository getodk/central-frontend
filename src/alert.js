/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { shallowReactive } from 'vue';

class AlertData {
  #data;

  constructor() {
    this.#data = shallowReactive({
      // The alert's "contextual" type: 'success', 'info', 'warning', or
      // 'danger'.
      type: 'danger',
      message: null,
      // `true` if the alert should be visible and `false` if not.
      state: false,
      // The time at which the alert was last shown
      at: new Date(),
      // Information about the Call to Action (CTA) button that's shown in the
      // alert
      cta: null
    });
  }

  get type() { return this.#data.type; }
  get message() { return this.#data.message; }
  get state() { return this.#data.state; }
  get at() { return this.#data.at; }
  get ctaText() { return this.#data.cta?.text; }
  get ctaHandler() { return this.#data.cta?.handler; }

  #show(type, message) {
    Object.assign(this.#data, {
      type,
      message,
      state: true,
      at: new Date(),
      cta: null
    });
    // Return the alert object for chaining.
    return this;
  }

  success(message) { return this.#show('success', message); }
  info(message) { return this.#show('info', message); }
  warning(message) { return this.#show('warning', message); }
  danger(message) { return this.#show('danger', message); }

  // `text` is the text of the CTA. `handler` is a function to call when the
  // user clicks the CTA.
  cta(text, handler) { this.#data.cta = { text, handler }; }

  blank() {
    this.#data.state = false;
    this.#data.message = null;
    this.#data.cta = null;
  }
}

// Returns an object to manage the reactive data for the toast, which is called
// the "alert" in the codebase. Only a single alert is shown at a time. It may
// be shown at the top of the page or in a modal. Regardless of where the alert
// is shown, its data will be stored in this object.
const createAlert = () => new AlertData();

export default createAlert;
