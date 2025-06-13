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

import { inject, onBeforeUnmount, readonly, shallowReactive, watch, watchEffect } from 'vue';

import useEventListener from './composables/event-listener';

let messageId = 0;

class AlertData {
  #data;
  #cta;
  #readonlyCta;

  constructor() {
    this.#data = shallowReactive({
      // `true` if the alert should be visible and `false` if not.
      state: false,
      // Unique identifier for each individual message
      messageId,
      // The alert's "contextual" type: 'success', 'info', 'warning', or
      // 'danger'.
      type: 'danger',
      message: null,
      // The time at which the alert was last shown
      at: new Date()
    });

    // Information about the Call to Action (CTA) button that's shown in the
    // alert
    this.#cta = shallowReactive({ text: null, handler: null, pending: false });
    this.#readonlyCta = readonly(this.#cta);
  }

  get state() { return this.#data.state; }
  get messageId() { return this.state ? this.#data.messageId : null; }
  get type() { return this.#data.type; }
  get message() { return this.#data.message; }
  get at() { return this.#data.at; }
  get cta() { return this.#cta.text != null ? this.#readonlyCta : null; }

  #resetCta() {
    Object.assign(this.#cta, { text: null, handler: null, pending: false });
  }

  #show(type, message) {
    messageId += 1;
    Object.assign(this.#data, {
      state: true,
      messageId,
      type,
      message,
      at: new Date()
    });
    this.#resetCta();
    // Return the alert object for chaining.
    return this;
  }

  success(message) { return this.#show('success', message); }
  info(message) { return this.#show('info', message); }
  warning(message) { return this.#show('warning', message); }
  danger(message) { return this.#show('danger', message); }

  // `text` is the text of the CTA. `handler` is a function to call when the
  // user clicks the CTA.
  cta(text, handler) {
    this.#cta.text = text;
    this.#cta.handler = () => {
      if (this.#cta.pending) return Promise.reject(new Error('CTA is pending'));
      this.#cta.pending = true;
      const startId = this.messageId;
      return Promise.resolve(handler())
        .then(() => {
          if (this.messageId === startId) this.hide();
        })
        .catch(() => {
          if (this.messageId === startId) this.#cta.pending = false;
        });
    };
  }

  hide() {
    this.#data.state = false;
    this.#data.message = null;
    this.#resetCta();
  }

  blank() { this.hide(); }

  install(app) { app.provide('alert', this); }
}

export const createAlert = () => new AlertData();

export const useAlert = (elementRef) => {
  const alert = inject('alert');

  // Hide a success alert after 7 seconds.
  let timeoutId;
  const hideAfterTimeout = () => {
    alert.hide();
    timeoutId = null;
  };
  const clearExistingTimeout = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  watch(() => alert.messageId, () => {
    clearExistingTimeout();
    if (alert.state && alert.type === 'success')
      timeoutId = setTimeout(hideAfterTimeout, 7000);
  });
  watchEffect(() => {
    if (alert.cta != null && alert.cta.pending) clearExistingTimeout();
  });
  onBeforeUnmount(clearExistingTimeout);

  // Hide an alert after a link is opened in a new tab.
  const hideAfterClick = (event) => {
    if (alert.state && event.target.closest('a[target="_blank"]') != null &&
      !event.defaultPrevented) {
      alert.hide();
    }
  };
  // Specifying `true` for event capturing so that an alert is not hidden
  // immediately if it was shown after the click.
  useEventListener(elementRef, 'click', hideAfterClick, true);

  return alert;
};
