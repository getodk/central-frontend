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
import Vue from 'vue';

export const MAXIMUM_TEST_DURATION = { seconds: 10 };

export class MockLogger {
  log() {}
  error() {}
}

// Triggers an event that does not bubble.
export const trigger = (eventName, wrapper, selector = undefined) => {
  const target = selector == null ? wrapper : wrapper.first(selector);
  target.trigger(eventName);
  const nextTick = Vue.nextTick();
  return selector == null ? nextTick : nextTick.then(() => wrapper);
};

const eventNames = ['change', 'click', 'submit'];
for (const name of eventNames)
  trigger[name] = (wrapper, selector = undefined) => trigger(name, wrapper, selector);

export const fillForm = (wrapper, selectorsAndValues) => {
  let promise = Promise.resolve();
  for (const [selector, value] of selectorsAndValues) {
    promise = promise.then(() => {
      const field = wrapper.first(selector);
      field.element.value = value;
      // If there is a v-model attribute, prompt it to sync.
      return trigger('input', field);
    });
  }
  return promise;
};
