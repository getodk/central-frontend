export const wait = (delay = 0) => new Promise(resolve => {
  setTimeout(resolve, delay);
});

// Returns the element for an object that may be an avoriaz wrapper.
export const unwrapElement = (elementOrWrapper) => {
  if (elementOrWrapper.isVueComponent === true) return elementOrWrapper.vm.$el;
  return elementOrWrapper.element != null
    ? elementOrWrapper.element
    : elementOrWrapper;
};
