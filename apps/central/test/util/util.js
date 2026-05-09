import sinon from 'sinon';

export const mockLogger = () => ({ log: sinon.fake(), error: sinon.fake() });

export const mockLocation = (mockedProperties) => new Proxy({}, {
  get: (_, name) =>
    (Object.hasOwn(mockedProperties, name)
      ? mockedProperties[name]
      : window.location[name])
});



////////////////////////////////////////////////////////////////////////////////
// WAITING

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

export const block = () => {
  let unlock;
  let fail;
  const lock = new Promise((resolve, reject) => {
    unlock = resolve;
    fail = reject;
  });
  return [lock, unlock, fail];
};
