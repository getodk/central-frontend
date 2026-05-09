// should match all locale keys, e.g. "en", "zh-Hant" etc.
const localePrefix = '^[\\w-]+\\.';
const regescape = s => s.replace(/[\[\].]/g, '\\$&');

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 'latest'
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/airbnb'
  ],
  plugins: [
    '@intlify/eslint-plugin-vue-i18n',
  ],
  globals: {
    $: 'readonly',
    alert: 'readonly',
    document: 'readonly',
    window: 'readonly',
    defineModel: 'readonly',
    __WEB_FORMS_VERSION__: 'readonly'
  },
  rules: {
    '@intlify/vue-i18n/no-unused-keys': [ 'error', {
      src: 'src/',
      ignores: [
        // Key use is determined by static analysis, so dynamically-generated key
        // and keys used indirectly must be listed here.
        // Detecting when to _remove_ a key from this list will be difficult.

        ...[
          'audit.action',
          'audit.category',
          'component.WebFormRenderer', // dynamic modals
          'conflict',
          'fields',
          'oidc.error',
          'outdatedVersionHtml', // check that file's comments
          'reviewState',
          'tab',
          'title.submissionBacklog',
          'title.updateReviewState',
          'type',

          // seeminly-unused keys: these should be removed, or their use documented
          'projectNav', // TODO maybe removed in 0b55d7d9f98f145c919c6e3476813275c4b69af7
        ].map(prefix => '/' + localePrefix + regescape(prefix) + '\\.' + '/'),

        ...[
          'back',
          'back.back',
          'back.title',
          'steps[0].introduction[1][0]',

          // seeminly-unused keys: these should be removed, or their use documented
          'header.idAndVersion', // TODO maybe removed in a3d695dcff139dcfefc37e13250b68a7965c4975

          // Keys referenced from $tcn(), tn(), deletedSubmission(), redAlert.show()
          // Unfortunately these need to be tracekd manually (https://github.com/intlify/eslint-plugin-vue-i18n/issues/643).
          //
          // To regenerate:
          //
          // ```sh
          // git grep -E "(\\\$tcn|\btn|\bdeletedSubmission|\bredAlert\.show)\('" -- apps/central/src/ | grep -Eo "'[^']+'" | tr -d "'" | sort -u | xargs -I{} echo "'{}',"
          // ```
          //
          'actionBar.message',
          'action.download.filtered.withCount',
          'action.download.unfiltered',
          'action.toggleDeletedEntities',
          'action.toggleDeletedSubmissions',
          'afterSelection.matched.countOfFiles',
          'afterSelection.someUnmatched.countOfFiles',
          'alert.bulkDelete',
          'alert.restored',
          'alert.success',
          'alert.unavailable',
          'clearEntities',
          'count.attachments',
          'count.warning',
          'datasetCount',
          'diff.changedCount',
          'diffCounts.datasetsOnly',
          'diffCounts.newProperties.entityLists',
          'diffCounts.newProperties.properties',
          'diff.newCount',
          'duringDragover.dropToPrepare.countOfFiles',
          'duringUpload.remaining.beforeLast',
          'duringUpload.total',
          'entities.subtitle',
          'entity.conflictsCount',
          'expected',
          'explanation.implication.records',
          'missingCount',
          'newProperties',
          'overlapTitle',
          'possibleConflictsCount',
          'present',
          'projects.subtitle',
          'rowCount',
          'showFewer',
          'showFewerDatasets',
          'showMore',
          'showMoreDatasets',
          'title.entity.update_version.submission.deleted.deletedSubmission',
          'title.submission.create.deleted.deletedSubmission',
          'unlinkForms',
          'zeroRow',
        ].map(exact => '/' + localePrefix + regescape(exact) + '$' + '/'),


        '/Modal.(body|title)$/',

        // odata-loading-message:
        `/${localePrefix}(entity|submission)\.(all|(filtered\.)?(withoutCount|first|middle|last\.(one|multiple)))$/`,
      ],
    }],
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': ['error', 'only-multiline'],
    curly: 'off',
    'implicit-arrow-linebreak': 'off',
    'import/first': 'off',
    "import/no-extraneous-dependencies": ['error', {'devDependencies': ['**/test/**', 'vite.config.js']}],
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
    'vue/attribute-hyphenation': 'off',
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
    'vue/require-prop-types': 'off',
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
    'vue/no-constant-condition': 'off',
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
