<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="markdown-textarea" :class="activeBorderClass">
    <textarea :value="modelValue" class="form-control"
      :placeholder="defaultText" :aria-label="defaultText"
      :required="required" :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)">
    </textarea>
    <div v-if="!emptyValue && previewMode" class="preview-container">
      <p class="heading">{{ $t('preview') }}</p>
      <markdown-view :raw-markdown="modelValue"/>
    </div>
    <div v-show="!emptyValue || showFooter " class="markdown-textarea-actions">
      <a href="https://commonmark.org/help/" class="external-help-link" target="_blank" rel="noopener">{{ $t('markdownSupported') }} </a>
      <span class="push"></span>
      <button class="btn md-preview-btn" type="button" @click="toggleViewMode">
        {{ previewButtonText }}
      </button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
import MarkdownView from './view.vue';

export default {
  name: 'MarkdownTextarea',
  components: { MarkdownView },
  props: {
    modelValue: {
      type: String
    },
    showFooter: {
      type: Boolean
    },
    defaultText: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean
    },
    rows: {
      type: String,
      default: '2'
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      previewMode: false
    };
  },
  computed: {
    emptyValue() {
      return this.modelValue === '' || this.modelValue == null;
    },
    previewButtonText() {
      return this.previewMode ? this.$t('action.hidePreview') : this.$t('action.showPreview');
    },
    activeBorderClass() {
      if (this.showFooter || !this.emptyValue)
        return 'active-border';
      return null;
    }
  },
  methods: {
    toggleViewMode() {
      this.previewMode = !this.previewMode;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.markdown-textarea {
  border: 1px solid transparent;
  &.active-border {
    border: 1px solid $color-info;
  }

  background: darken( $color-subpanel-background, 3% );

  .form-group {
    margin-bottom: 0;
    padding-bottom: 0px;
  }

  textarea {
    border-bottom-color: #aaa;
    resize: vertical;
  }

  .preview-container {
    padding: 10px;

    .heading {
      font-weight: bold;
      margin-bottom: 5px;
    }
  }

  .md-preview-btn {
    background-color: #bbb;
    color: #333;
    &:hover, &:focus, &:active:focus { background-color: #888; }
  }

  .markdown-textarea-actions {
    @include clearfix;
    display: flex;
    align-content: stretch;
    align-items: center;
    margin-top: 5px;
  }

  .markdown-textarea-actions > .btn {
    margin: 3px;
  }

  .push {
    margin-left: auto;
  }

  .external-help-link {
    color: #888;
    font-size: 12px;
    text-decoration: underline;
    text-decoration-style: dotted;
    padding: 10px;
    &:hover, &:focus, &:active:focus { color: #777; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a link to an external website with Markdown style guidelines
    "markdownSupported": "Markdown supported",
    // This is text shown as a label above the preview of Markdown formatting (special formatting of user-submitted text)
    "preview": "Preview"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "markdownSupported": "Markdown podporován",
    "preview": "Náhled"
  },
  "de": {
    "markdownSupported": "unterstützt durch Markdown",
    "preview": "Vorschau"
  },
  "es": {
    "markdownSupported": "soporte Markdown",
    "preview": "Vista previa"
  },
  "fr": {
    "markdownSupported": "Syntaxe Markdown supportée",
    "preview": "Aperçu"
  },
  "id": {
    "markdownSupported": "Markdown didukung",
    "preview": "Pratinjau"
  },
  "it": {
    "markdownSupported": "Markdown supportato",
    "preview": "Anteprima"
  },
  "ja": {
    "markdownSupported": "マークダウンがサポートされています。",
    "preview": "プレビュー"
  },
  "pt": {
    "markdownSupported": "Formatação em estilo Markdown suportada",
    "preview": "Visualização"
  },
  "sw": {
    "markdownSupported": "Markdown inatumika",
    "preview": "Hakiki"
  },
  "zh-Hant": {
    "markdownSupported": "支持 Markdown 語法",
    "preview": "預覽"
  }
}
</i18n>
