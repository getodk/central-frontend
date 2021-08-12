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
  <div id="markdown-textarea" :class="activeBorderClass">
    <div class="form-group">
      <textarea :value="value" class="form-control"
        :placeholder="defaultText" :aria-label="defaultText"
        required rows="2" @input="update">
      </textarea>
    </div>
    <div v-if="value !== '' && previewMode" id="preview-container">
      <p class="heading">{{ $t('preview') }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <markdown-view :raw-markdown="value"/>
    </div>
    <div v-show="value !== '' || showFooter " id="submission-comment-actions">
      <a href="https://commonmark.org/help/" class="external-help-link" target="_blank" rel="noopener">{{ $t('markdownSupported') }} </a>
      <span class="push"></span>
      <button class="btn md-preview-btn" @click.prevent="toggleViewMode">
        {{ previewButtonText }}
      </button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify';
import marked from 'marked';

import MarkdownView from '../markdown-view.vue';


DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer noopener');
  }
});

export default {
  name: 'MarkdownTextarea',
  components: { MarkdownView },
  props: {
    value: {
      type: String,
      required: true
    },
    showFooter: {
      type: Boolean,
      default: false
    },
    defaultText: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      valueMarkdown: '',
      previewMode: false
    };
  },
  computed: {
    previewButtonText() {
      return this.previewMode ? this.$t('toggle.hidePreview') : this.$t('toggle.showPreview');
    },
    activeBorderClass() {
      if (this.showFooter || this.value !== '')
        return 'active-border';
      return null;
    }
  },
  methods: {
    update(event) {
      // Sanitize the same way as feed-entry.vue
      const rawComment = event.target.value;
      const md = marked(rawComment, { gfm: true, breaks: true });
      const santized = DOMPurify.sanitize(md, {
        FORBID_ATTR: ['style', 'class', 'id', 'data'],
        ALLOWED_TAGS: ['a', 'b', 'br', 'code', 'em',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'hr', 'i', 'img', 'li', 'ol', 'p',
          'pre', 's', 'small', 'sub', 'sup', 'strong', 'u', 'ul'],
        ALLOW_DATA_ATTR: false
      });
      this.valueMarkdown = santized;
      this.$emit('input', event.target.value);
    },
    toggleViewMode() {
      this.previewMode = !this.previewMode;
    }
  }
};
</script>

<style lang="scss">

#markdown-textarea {
  &.active-border {
    border: 1px solid #31708f;
  }

  background: #eaeaea;

  .form-group {
    margin-bottom: 0;
    padding-bottom: 0px;
  }

  textarea {
    border-bottom-color: #aaa;
    resize: vertical;
  }

  #preview-container {
    padding: 10px;

    .heading {
      font-weight: bold;
      margin-bottom: 5px;
    }
  }

  .md-preview-btn {
    background-color: #999;
    color: white;
  }

  #submission-comment-actions {
    display: flex;
    align-content: stretch;
    align-items: center;
  }

  #submission-comment-actions > .btn {
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
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is a link to an external website with Markdown style guidelines
    "markdownSupported": "Markdown supported",
    // This is text shown as a label above the preview of Markdown formatting (special formatting of user-submitted text)
    "preview": "Preview",
    // This text is shown on a button that the user clicks to change if the Markdown preview is shown or not
    "toggle": {
      "showPreview": "Preview",
      "hidePreview": "Hide Preview"
    }
  }
}
</i18n>
