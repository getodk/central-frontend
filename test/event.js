import Vue from 'vue';

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
      field.trigger('input');
      return Vue.nextTick();
    });
  }
  return promise;
};
