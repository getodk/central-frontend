import Vue from 'vue';



////////////////////////////////////////////////////////////////////////////////
// CREATING EVENTS

export const dataTransfer = (files) => {
  const dt = new DataTransfer();
  for (const file of files) {
    // DataTransferItemList is not supported in IE. MDN indicates that
    // DataTransferItemList.prototype.add() is not supported even in Chrome, but
    // another source seems to imply that it is, and I am not encountering any
    // issues using it in Headless Chrome.
    dt.items.add(file);
  }
  return dt;
};

const dragEvent = (type, { target, files, ie = false }) => {
  const dt = !ie
    ? dataTransfer(files)
    /* This object does not have all the properties of a DataTransfer object,
    and its `files` property is an Array, not a FileList. However, I think the
    only code that will use the object will be jQuery and Central: I think the
    object will never actually be passed to the browser's drag functionality. We
    can add more properties to the object as we need them for testing. */
    : { files, types: ['Files'], dropEffect: 'none' };
  const originalEvent = $.Event(type, { dataTransfer: dt });
  return $.Event(type, { target, originalEvent });
};



////////////////////////////////////////////////////////////////////////////////
// trigger

export const trigger = {};

const simpleEventNames = ['change', 'click', 'submit'];
for (const eventName of simpleEventNames) {
  // Triggers an event that does not bubble.
  trigger[eventName] = (wrapper, selector = undefined) => {
    const target = selector == null ? wrapper : wrapper.first(selector);
    target.trigger(eventName);
    const nextTick = Vue.nextTick();
    return selector == null ? nextTick : nextTick.then(() => wrapper);
  };
}

const normalizeTriggerDragEventArgs = (args) => {
  if (args.length === 0) throw new Error('files or event options required');
  if (args.length === 1)
    return normalizeTriggerDragEventArgs([undefined, args[0]]);
  const [selector, filesOrEventOptions] = args;
  const eventOptions = Array.isArray(filesOrEventOptions)
    ? { files: filesOrEventOptions }
    : filesOrEventOptions;
  return { selector, eventOptions };
};

const dragEventNames = ['dragenter', 'dragover', 'dragleave', 'drop'];
for (const eventName of dragEventNames) {
  trigger[eventName] = (wrapper, ...args) => {
    const { selector, eventOptions } = normalizeTriggerDragEventArgs(args);
    const targetWrapper = selector == null ? wrapper : wrapper.first(selector);
    const target = targetWrapper.isVueComponent
      ? targetWrapper.vm.$el
      : targetWrapper.element;
    const event = dragEvent(eventName, { ...eventOptions, target });
    $(target).trigger(event);
    const nextTick = Vue.nextTick();
    return selector == null ? nextTick : nextTick.then(() => wrapper);
  };
}

// Note that these `trigger` methods do not pass information to each other: each
// uses `args` without knowledge of any previous use. That means that each
// method instantiates its own data transfer object, and if `selector` is
// specified, each searches for the event target.
trigger.dragAndDrop = (...args) => trigger.dragenter(...args)
  .then(() => trigger.dragover(...args))
  .then(() => trigger.drop(...args));



////////////////////////////////////////////////////////////////////////////////
// TRIGGERING A SERIES OF EVENTS

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
