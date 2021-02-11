import sinon from 'sinon';



////////////////////////////////////////////////////////////////////////////////
// setTimeout()

// In case setTimeout() is faked
const nativeSetTimeout = setTimeout;

export const wait = (delay = 0) => new Promise(resolve => {
  nativeSetTimeout(resolve, delay);
});

export const waitUntil = (f) => new Promise(resolve => {
  const waiter = () => {
    if (f())
      resolve();
    else
      nativeSetTimeout(waiter, 10);
  };
  waiter();
});

// Deprecated. Use sinon.useFakeTimers() instead.
export const fakeSetTimeout = () => {
  const callbacks = new Map();
  let currentId = 0;
  sinon.replace(window, 'setTimeout', sinon.fake(callback => {
    currentId += 1;
    callbacks.set(currentId, callback);
    return currentId;
  }));
  sinon.replace(window, 'clearTimeout', sinon.fake(id => {
    callbacks.delete(id);
  }));
  return {
    runAll: () => {
      // Looping in this way, because a callback may itself call setTimeout() or
      // clearTimeout().
      while (callbacks.size !== 0) {
        const [id, callback] = callbacks.entries().next().value;
        callbacks.delete(id);
        callback();
      }
    }
  };
};



////////////////////////////////////////////////////////////////////////////////
// AVORIAZ

// Returns the element for an object that may be an avoriaz wrapper.
export const unwrapElement = (elementOrWrapper) => {
  if (elementOrWrapper.isVueComponent === true) return elementOrWrapper.vm.$el;
  return elementOrWrapper.element != null
    ? elementOrWrapper.element
    : elementOrWrapper;
};
