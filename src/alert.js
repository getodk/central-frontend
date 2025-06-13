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
createAlert() returns an object to manage the reactive data for an alert. The
Alert component uses this data to render the alert.

The root component can call useAlert() to set up additional functionality for
an alert. For example, useAlert() will auto-hide the alert.
*/

import { onBeforeUnmount, readonly, shallowReactive, watch, watchEffect } from 'vue';

import useEventListener from './composables/event-listener';

let messageId = 0;

class AlertData {
  #data;
  #cta;
  #readonlyCta;
  #defaultOptions;

  constructor(defaultOptions = undefined) {
    this.#defaultOptions = {
      autoHide: true,
      ...defaultOptions
    };
    this.#data = shallowReactive({
      // `true` if the alert should be visible and `false` if not.
      state: false,
      // Unique identifier for each individual message
      messageId,
      message: null,
      // The time at which the alert was last shown
      at: new Date(),
      ...this.#defaultOptions
    });

    // Data about the Call to Action (CTA) button that's shown in the alert
    this.#cta = shallowReactive({ text: null, handler: null, pending: false });
    this.#readonlyCta = readonly(this.#cta);
  }

  get state() { return this.#data.state; }
  get messageId() { return this.state ? this.#data.messageId : null; }
  get message() { return this.#data.message; }
  get at() { return this.#data.at; }
  get autoHide() { return this.state && this.#data.autoHide; }
  get cta() { return this.#cta.text != null ? this.#readonlyCta : null; }

  #resetCta() {
    if (this.#cta.text == null) return;
    Object.assign(this.#cta, { text: null, handler: null, pending: false });
  }

  // Shows a new alert message. Returns an object with a cta() method to add a
  // CTA to the alert.
  show(message, options = undefined) {
    messageId += 1;
    Object.assign(this.#data, {
      state: true,
      messageId,
      message,
      at: new Date()
    });
    Object.assign(this.#data, this.#defaultOptions, options);
    this.#resetCta();
    // eslint-disable-next-line no-use-before-define
    return new AlertChain(this, this.#cta);
  }

  hide() {
    if (!this.state) return;
    Object.assign(this.#data, { state: false, message: null });
    Object.assign(this.#data, this.#defaultOptions);
    this.#resetCta();
  }
}

class AlertChain {
  #alert;
  #cta;
  #startId;

  constructor(alert, cta) {
    this.#alert = alert;
    this.#cta = cta;
    this.#startId = alert.messageId;
  }

  // Checks that there hasn't been a change to the alert since the AlertChain
  // was created.
  #checkChange() {
    if (!this.#alert.state) throw new Error('no alert');
    if (this.#alert.messageId !== this.#startId) throw new Error('new alert');
  }

  // `text` is the text of the CTA. `handler` is a function to call when the
  // user clicks the CTA.
  cta(text, handler) {
    this.#checkChange();
    this.#cta.text = text;

    // Wraps the specified handler in a function with some extra behavior.
    this.#cta.handler = () => {
      this.#checkChange();
      if (this.#cta.pending) return Promise.reject(new Error('CTA is pending'));
      this.#cta.pending = true;
      return Promise.resolve(handler())
        .then(() => {
          if (this.#alert.messageId === this.#startId) this.#alert.hide();
        })
        .catch(() => {
          if (this.#alert.messageId === this.#startId) this.#cta.pending = false;
        });
    };
  }
}

export const createAlert = () => new AlertData();



////////////////////////////////////////////////////////////////////////////////
// useAlert()

// Sets up the mechanism to auto-hide the alert.
const autoHide = (alert) => {
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
    if (alert.state && alert.autoHide)
      timeoutId = setTimeout(hideAfterTimeout, 7000);
  });
  watchEffect(() => {
    if (alert.cta != null && alert.cta.pending) clearExistingTimeout();
  });
  onBeforeUnmount(clearExistingTimeout);
};

// Sets up an event listener to hide the alert after a link is opened in a new
// tab.
const hideAfterLinkClick = (alert, elementRef) => {
  const handleClick = (event) => {
    if (alert.state && !event.defaultPrevented &&
      event.target.closest('a[target="_blank"]') != null) {
      alert.hide();
    }
  };
  // Specifying `true` for event capturing so that the alert is not hidden
  // immediately if it was shown after the click.
  useEventListener(elementRef, 'click', handleClick, true);
};

export const useAlert = (alert, elementRef) => {
  autoHide(alert);
  hideAfterLinkClick(alert, elementRef);
};
