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
import Vue from 'vue';

export const MAXIMUM_TEST_DURATION = { seconds: 10 };

export class MockLogger {
  log() {}
  error() {}
}

export const trigger = (eventName, wrapper, bubbles = false) => {
  if (!bubbles) {
    // trigger() triggers an event that does not bubble.
    wrapper.trigger(eventName);
  } else {
    $(wrapper.element).trigger(eventName);
  }
  return Vue.nextTick();
};

const EVENT_NAMES = ['change', 'click', 'submit'];
for (const name of EVENT_NAMES)
  trigger[name] = (wrapper, bubbles = false) => trigger(name, wrapper, bubbles);

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
