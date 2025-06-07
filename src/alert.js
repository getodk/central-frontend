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

/*
createAlert() returns an object to manage the reactive data for the toast, which
is called the "alert" in the codebase. Only a single alert is shown at a time.
An alert may be shown at the top of the page or in a modal. Regardless of where
the alert is shown, its data will be stored in the object returned by
createAlert(). The object will be installed as a plugin, allowing it to be
injected in components. The object will also be accessible from the container
object.

The Alert component renders the alert using the alert object.

The root component should call useAlert() to set up additional functionality for
the alert. For example, useAlert() will hide a success alert automatically.
*/

import { inject, onBeforeUnmount, shallowReactive, watch } from 'vue';

import useEventListener from './composables/event-listener';

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

export const createAlert = () => new AlertData();

export const useAlert = (elementRef) => {
  const alert = inject('alert');

  // Hide a success alert after 7 seconds.
  let timeoutId;
  const hideAfterTimeout = () => {
    alert.blank();
    timeoutId = null;
  };
  const clearExistingTimeout = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  watch([() => alert.state, () => alert.at], () => {
    clearExistingTimeout();
    if (alert.state && alert.type === 'success')
      timeoutId = setTimeout(hideAfterTimeout, 7000);
  });
  onBeforeUnmount(clearExistingTimeout);

  // Hide an alert after a link is opened in a new tab.
  const hideAfterClick = (event) => {
    if (alert.state && event.target.closest('a[target="_blank"]') != null &&
      !event.defaultPrevented) {
      alert.blank();
    }
  };
  // Specifying `true` for event capturing so that an alert is not hidden
  // immediately if it was shown after the click.
  useEventListener(elementRef, 'click', hideAfterClick, true);

  return alert;
};
