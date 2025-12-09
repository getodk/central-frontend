module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 'latest'
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/airbnb'
  ],
  globals: {
    $: 'readonly',
    alert: 'readonly',
    document: 'readonly',
    window: 'readonly',
    defineModel: 'readonly'
  },
  rules: {
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': ['error', 'only-multiline'],
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
    'prefer-object-has-own': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    'spaced-comment': 'off',
    'vue/attributes-order': ['error', {
      order: [
        'LIST_RENDERING',
        ['CONDITIONALS', 'DEFINITION'],
        'RENDER_MODIFIERS',
        'GLOBAL',
        ['UNIQUE', 'SLOT'],
        'TWO_WAY_BINDING',
        ['OTHER_DIRECTIVES', 'OTHER_ATTR'],
        'EVENTS',
        'CONTENT'
      ],
      alphabetical: false
    }],
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
    'vue/no-setup-props-destructure': 'off',
    'vue/no-template-target-blank': 'off',
    'vue/object-curly-newline': 'off',
    'vue/require-default-prop': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vuejs-accessibility/label-has-for': ['error', {
      controlComponents: ['flatpickr'],
      required: {
        some: ['nesting', 'id']
      }
    }]
  }
};
