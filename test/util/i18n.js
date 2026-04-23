export const setupLanguages = (afterEach) => {
  // Check that it's safe to set and delete navigator.languages. It looks like
  // `languages` is actually set on the prototype of `navigator`.
  Object.hasOwn(navigator, 'languages').should.be.false;
  afterEach(() => { delete navigator.languages; });
};

export const setLanguages = (locales) => {
  Object.defineProperty(navigator, 'languages', {
    value: locales,
    configurable: true
  });
};
