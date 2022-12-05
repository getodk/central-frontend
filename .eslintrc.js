module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/airbnb'
  ],
  env: {
    node: true
  },
  globals: {
    $: 'readonly',
    alert: 'readonly',
    document: 'readonly',
    window: 'readonly'
  },
  rules: {
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': ['error', 'never'],
    curly: 'off',
    'implicit-arrow-linebreak': 'off',
    'import/first': 'off',
    'lines-between-class-members': ['error', 'always', {
      exceptAfterSingleLine: true
    }],
    'max-classes-per-file': 'off',
    'max-len': 'off',
    'vue/max-len': 'off',
    'newline-per-chained-call': 'off',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-multiple-empty-lines': ['error', { max: 3 }],
    'no-nested-ternary': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-underscore-dangle': 'off',
    'nonblock-statement-body-position': 'off',
    'object-curly-newline': ['error', {
      multiline: true,
      minProperties: 0,
      consistent: true
    }],
    'object-property-newline': 'off',
    'operator-linebreak': ['error', 'after', {
      overrides: { '?': 'before', ':': 'before' }
    }],
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    'spaced-comment': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-closing-bracket-newline': ['error', {
      singleline: 'never',
      multiline: 'never'
    }],
    'vue/html-closing-bracket-spacing': ['error', {
      startTag: 'never',
      endTag: 'never',
      selfClosingTag: 'never'
    }],
    'vue/html-indent': 'off',
    'vue/html-self-closing': ['error', {
      html: {
        void: 'never',
        normal: 'never',
        component: 'always'
      },
      svg: 'always',
      math: 'always'
    }],
    'vue/max-attributes-per-line': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-template-target-blank': 'off',
    'vue/require-default-prop': 'off',
    'vue/singleline-html-element-content-newline': 'off'
  }
};
