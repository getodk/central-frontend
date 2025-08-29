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
    'no-await-in-loop': 'off',
    'no-unused-expressions': 'off'
  }
};
