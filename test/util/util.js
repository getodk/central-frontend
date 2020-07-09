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

export const fakeSetTimeout = () => {
  const callbacks = [];
  sinon.replace(window, 'setTimeout', sinon.fake(callback => {
    callbacks.push(callback);
  }));
  return {
    runAll: () => {
      while (callbacks.length !== 0) {
        const callback = callbacks[0];
        callback();
        callbacks.shift();
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
