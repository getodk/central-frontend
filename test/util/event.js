import Vue from 'vue';

import { unwrapElement } from './util';



////////////////////////////////////////////////////////////////////////////////
// dataTransfer()

export const dataTransfer = (files) => {
  const dt = new DataTransfer();
  for (const file of files) {
    // MDN indicates that DataTransferItemList.prototype.add() is not supported
    // in Chrome, but another source seems to imply that it is. I am not
    // encountering any issues using it in Headless Chrome.
    dt.items.add(file);
  }
  return dt;
};



////////////////////////////////////////////////////////////////////////////////
// trigger

export const trigger = {};

/*
trigger.click() triggers a click event, then waits a tick for the DOM to update.
For example:

  // Specify an Avoriaz wrapper.
  trigger.click(wrapper);

  // To trigger a click on a descendant element, specify a selector.
  trigger.click(wrapper, 'button');

  // If the wrapper is omitted, trigger.click() returns a function that expects
  // the wrapper.
  const clickButton = trigger.click('button');
  return clickButton(wrapper);
*/
trigger.click = (...args) => {
  if (args.length === 0) throw new Error('invalid arguments');
  if (typeof args[0] === 'string')
    return (wrapper) => trigger.click(wrapper, ...args);
  const [wrapper, selector] = args;
  const target = selector == null ? wrapper : wrapper.first(selector);
  target.trigger('click');
  return Vue.nextTick().then(() => wrapper);
};

// Define methods for events that change the value of an <input> or <select>
// element. Many tests will use trigger.changeValue(), but if a component uses
// v-model, the test will probably use either trigger.input(),
// trigger.fillForm(), or trigger.submitForm().
for (const [name, event] of [['changeValue', 'change'], ['input', 'input']]) {
  trigger[name] = (wrapper, ...args) => {
    if (args.length === 0) throw new Error('value required');
    if (args.length === 1) return trigger[name](wrapper, null, args[0]);
    const [selector, value] = args;
    const target = selector == null ? wrapper : wrapper.first(selector);
    if (target.element.value === value) throw new Error('no change');
    target.element.value = value;
    target.trigger(event);
    return Vue.nextTick().then(() => wrapper);
  };
}

// Checks a checkbox or radio input, triggering a change event.
trigger.check = (wrapper, selector = null) => {
  const target = selector != null ? wrapper.first(selector) : wrapper;
  if (target.element.checked) throw new Error('already checked');
  target.element.checked = true;
  target.trigger('change');
  return Vue.nextTick().then(() => wrapper);
};

// Unchecks a checkbox or radio input, triggering a change event.
trigger.uncheck = (wrapper, selector = null) => {
  const target = selector != null ? wrapper.first(selector) : wrapper;
  if (!target.element.checked) throw new Error('already unchecked');
  target.element.checked = false;
  target.trigger('change');
  return Vue.nextTick().then(() => wrapper);
};

/*
trigger.fillForm() fills one or more form fields. It is designed to work with
v-model. For example:

  // First specify an Avoriaz wrapper that wraps a DOM node or Vue component
  // that contains the fields. Then for each field, specify how to select the
  // field, as well as the field's value. trigger.fillForm() returns a promise
  // that resolves to the wrapper.
  trigger.fillForm(wrapper, [
    ['input[type="text"]', 'Some text'],
    ['input[type="checkbox"]', true],
    ['select', 'some_option']
  ]);

  // If the wrapper is omitted, trigger.fillForm() returns a function that
  // expects the wrapper.
  const fillInput = trigger.fillForm([
    ['input[type="text"]', 'Some text']
  ]);
  fillInput(wrapper);
*/
trigger.fillForm = (...args) => {
  if (args.length === 0) throw new Error('invalid arguments');
  if (Array.isArray(args[0]))
    return (wrapper) => trigger.fillForm(wrapper, ...args);
  const [wrapper, selectorsAndValues] = args;
  const promise = selectorsAndValues.reduce(
    (acc, [selector, value]) => acc.then(() => {
      const field = wrapper.first(selector);
      const { tagName } = unwrapElement(field);
      if (tagName === 'INPUT') {
        const type = field.hasAttribute('type')
          ? field.getAttribute('type')
          : 'text';
        if (type === 'checkbox' || type === 'radio') {
          if (value === true) return trigger.check(field);
          if (value === false) return trigger.uncheck(field);
          throw new Error('invalid value');
        }
        return trigger.input(field, value);
      }
      if (tagName === 'SELECT') return trigger.changeValue(field, value);
      throw new Error('unsupported element');
    }),
    Promise.resolve()
  );
  return promise.then(() => wrapper);
};
// Deprecated: use trigger.fillForm() instead.
export const { fillForm } = trigger;

/*
trigger.submit() submits a form. For example:

  // Triggers a submit event on a form element. `wrapper` is an Avoriaz wrapper.
  // trigger.submit() returns a promise that resolves to the wrapper.
  trigger.submit(wrapper);

  // You can also specify a selector for the form.
  trigger.submit(wrapper, 'form');

  // If the last argument is an array, trigger.submit() will call
  // trigger.fillForm().
  trigger.submit(wrapper, [
    ['input[type="text"]', 'Some text']
  ]);

  // If the wrapper is omitted, trigger.submit() returns a function that expects
  // the wrapper.
  const submitForm = trigger.submit('form');
  submitForm(wrapper);
*/
trigger.submit = (...args) => {
  if (args.length === 0) throw new Error('invalid arguments');
  if (typeof args[0] === 'string' || Array.isArray(args[0]))
    return (wrapper) => trigger.submit(wrapper, ...args);
  if (args.length === 2 && Array.isArray(args[1]))
    return trigger.submit(args[0], null, args[1]);
  const [wrapper, formSelector, fieldSelectorsAndValues] = args;
  const form = formSelector != null ? wrapper.first(formSelector) : wrapper;
  const promise = fieldSelectorsAndValues != null
    ? trigger.fillForm(form, fieldSelectorsAndValues)
    : Promise.resolve();
  return promise
    .then(() => {
      form.trigger('submit');
      return Vue.nextTick();
    })
    .then(() => wrapper);
};
// Deprecated: use trigger.submit() instead.
export const submitForm = trigger.submit;

// Drag events
for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
  trigger[eventName] = (wrapper, ...args) => {
    if (args.length === 0) throw new Error('files required');
    if (args.length === 1) return trigger[eventName](wrapper, null, args[0]);
    const [selector, files] = args;
    const target = selector == null ? wrapper : wrapper.first(selector);
    const targetElement = unwrapElement(target);
    $(targetElement).trigger($.Event(eventName, {
      target: targetElement,
      originalEvent: $.Event(eventName, { dataTransfer: dataTransfer(files) })
    }));
    return Vue.nextTick().then(() => wrapper);
  };
}

// Note that these `trigger` methods do not pass information to each other: each
// uses `args` without knowledge of any previous use. That means that each
// method instantiates its own data transfer object, and if `selector` is
// specified, each searches for the event target.
trigger.dragAndDrop = (...args) => trigger.dragenter(...args)
  .then(() => trigger.dragover(...args))
  .then(() => trigger.drop(...args));
