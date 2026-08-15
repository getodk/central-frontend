const hooks = {};
const addHook = (type) => (callback) => {
  if (hooks[type] == null) hooks[type] = [];
  hooks[type].push(callback);
};
const callHooks = async (type) => {
  if (hooks[type] == null) return;
  for (const callback of hooks[type]) await callback();
};

export const beforeEachFile = addHook('beforeEachFile');
export const afterEachFile = addHook('afterEachFile');
export const beforeEachTest = addHook('beforeEachTest');
export const afterEachTest = addHook('afterEachTest');

let describe;
const testFile = (title, tests) => {
  describe(title, () => {
    beforeAll(() => callHooks('beforeEachFile'));
    afterAll(() => callHooks('afterEachFile'));
    beforeEach(() => callHooks('beforeEachTest'));
    afterEach(() => callHooks('afterEachTest'));

    window.describe = describe;
    tests();
    window.describe = testFile;
  });
};
for (const modifier of ['skip', 'skipIf', 'runIf', 'only']) {
  testFile[modifier] = () => {
    throw new Error(`describe.${modifier}() is not supported here. Pass a filter to \`npm run test\` instead.`);
  };
}

export const setupHooks = (d) => {
  describe = d;
  window.describe = testFile;
};
