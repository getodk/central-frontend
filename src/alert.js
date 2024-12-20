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
      // Either a string or an array with a component and props for the
      // component
      content: null,
      // The time at which the alert was last shown
      at: new Date()
    });
  }

  // Returns `true` if the alert should be visible and `false` if not.
  get state() { return this.content != null; }

  get type() { return this.#data.type; }

  get content() { return this.#data.content; }

  get message() {
    const { content } = this.#data;
    return typeof content === 'string' ? content : null;
  }

  get at() { return this.#data.at; }

  // `content` can be a string, an array with a component and props for the
  // component, or just a component.
  #show(type, content) {
    this.#data.type = type;
    this.#data.content = typeof content === 'string' || Array.isArray(content)
      ? content
      : [content, {}];
    this.#data.at = new Date();
  }

  success(content) { this.#show('success', content); }
  info(content) { this.#show('info', content); }
  warning(content) { this.#show('warning', content); }
  danger(content) { this.#show('danger', content); }

  blank() { this.#data.content = null; }
}

// Only a single alert is shown at a time. This function returns an object that
// manages the data for the alert. Regardless of where an alert is rendered, its
// data will be stored in this object.
export default () => new AlertData();
