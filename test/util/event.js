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

// See below for examples of these functions.
const triggerFunction = (f) => {
  const withWrapper = (wrapper, ...rest) => {
    if (rest.length < f.length - 1) throw new Error('too few arguments');
    let target = wrapper;
    if (rest.length > f.length - 1) {
      try {
        // If rest[0] is a valid avoriaz selector, then we will use it to
        // select. However, it is difficult to determine whether it is a valid
        // selector. Here we try using it as a selector; if it is not a valid
        // selector, then avoriaz will throw an error.
        target = wrapper.first(rest[0]);
        rest.shift();
      } catch (e) {}
    }
    return Promise.resolve(f(target, ...rest)).then(() => wrapper);
  };
  return (...args) => {
    if (args.length === 0) throw new Error('too few arguments');
    const firstArgIsWrapper = args[0] != null && typeof args[0] === 'object' &&
      args[0].element instanceof HTMLElement;
    return firstArgIsWrapper
      ? withWrapper(...args)
      : (wrapper) => withWrapper(wrapper, ...args);
  };
};

trigger.mouseover = triggerFunction(target => {
  target.element.dispatchEvent(new MouseEvent('mouseover', {
    bubbles: true,
    cancelable: true
  }));
});

trigger.mouseleave = triggerFunction(target => {
  target.trigger('mouseleave');
});

/*
trigger.click() triggers a click event, then waits a tick for Vue to react. For
example:

  // Specify an avoriaz wrapper.
  trigger.click(wrapper);

  // To trigger a click on a descendant element, specify a selector.
  trigger.click(wrapper, 'button');

  // If the wrapper is omitted, trigger.click() returns a function that expects
  // the wrapper.
  const clickButton = trigger.click('button');
  clickButton(wrapper);
*/
trigger.click = triggerFunction(target => {
  // The avoriaz trigger() method triggers an event that does not bubble, so we
  // trigger our own event.
  target.element.click();
});

/* eslint-disable no-param-reassign */

// Define methods for events that change the value of an <input> or <select>
// element. Many tests will use trigger.changeValue(), but if a component uses
// v-model, the test will probably use one of trigger.input(),
// trigger.fillForm(), or trigger.submit().
for (const [name, event] of [['changeValue', 'change'], ['input', 'input']]) {
  trigger[name] = triggerFunction((target, value) => {
    if (target.element.value === value) throw new Error('no change');
    target.element.value = value;
    target.trigger(event);
  });
}

// Checks a checkbox or radio input, triggering a change event.
trigger.check = triggerFunction(input => {
  if (input.element.checked) throw new Error('already checked');
  input.element.checked = true;
  input.trigger('change');
});

// Unchecks a checkbox or radio input, triggering a change event.
trigger.uncheck = triggerFunction(input => {
  if (!input.element.checked) throw new Error('already unchecked');
  input.element.checked = false;
  input.trigger('change');
});

/* eslint-enable no-param-reassign */

/*
trigger.fillForm() fills one or more form fields. It is designed to work with
v-model. For example:

  // First specify an avoriaz wrapper that wraps a DOM node or Vue component
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
trigger.fillForm = triggerFunction(async (container, selectorsAndValues) => {
  for (const [selector, value] of selectorsAndValues) {
    const field = container.first(selector);
    const { tagName } = field.element;
    /* eslint-disable no-await-in-loop */
    if (tagName === 'INPUT') {
      const { type } = field.element;
      if (type === 'checkbox' || type === 'radio') {
        if (value)
          await trigger.check(field);
        else
          await trigger.uncheck(field);
      } else {
        await trigger.input(field, value);
      }
    } else if (tagName === 'SELECT') {
      await trigger.changeValue(field, value);
    } else {
      throw new Error('unsupported element');
    }
    /* eslint-enable no-await-in-loop */
  }
});
// Deprecated: use trigger.fillForm() instead.
export const { fillForm } = trigger;

/*
trigger.submit() submits a form. For example:

  // Triggers a submit event on a form element. `wrapper` is an avoriaz wrapper.
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
trigger.submit = triggerFunction(async (form, fieldSelectorsAndValues = undefined) => {
  if (fieldSelectorsAndValues != null)
    await trigger.fillForm(form, fieldSelectorsAndValues);
  form.trigger('submit');
});
// Deprecated: use trigger.submit() instead.
export const submitForm = trigger.submit;

for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) {
  trigger[type] = triggerFunction((target, files) => {
    $(target.element).trigger($.Event(type, {
      target: target.element,
      originalEvent: $.Event(type, { dataTransfer: dataTransfer(files) })
    }));
  });
}

trigger.dragAndDrop = triggerFunction(async (target, files) => {
  // Each method will instantiate its own DataTransfer object.
  await trigger.dragenter(target, files);
  await trigger.dragover(target, files);
  return trigger.drop(target, files);
});
