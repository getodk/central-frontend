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

    // Chai
    should: 'readonly',
    expect: 'readonly'
  },
  rules: {
    'eol-last': 'error',
    'no-await-in-loop': 'off',
    'no-unused-expressions': 'off'
  }
};
