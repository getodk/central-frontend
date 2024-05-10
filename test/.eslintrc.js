module.exports = {
  globals: {
    // Vitest
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',

    should: 'readonly'
  },
  rules: {
    'no-await-in-loop': 'off'
  }
};
