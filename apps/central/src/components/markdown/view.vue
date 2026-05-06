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

<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="markdown-view" v-html="renderedMarkdown"></div>
</template>
<!-- eslint-enable vue/no-v-html -->

<script>
import DOMPurify from 'dompurify';
import { marked } from 'marked';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer noopener');
  }
});

const forbiddenAttributes = ['style', 'class', 'id', 'data'];
const allowedTags = ['a', 'b', 'br', 'code', 'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'li', 'ol', 'p',
  'pre', 's', 'small', 'sub', 'sup', 'strong', 'u', 'ul'];

export default {
  name: 'MarkdownView',
  props: {
    rawMarkdown: {
      type: String,
      required: true
    }
  },
  computed: {
    renderedMarkdown() {
      const md = marked.parse(this.rawMarkdown, { gfm: true, breaks: true });
      const santized = DOMPurify.sanitize(md, {
        FORBID_ATTR: forbiddenAttributes,
        ALLOWED_TAGS: allowedTags,
        ALLOW_DATA_ATTR: false
      });
      return santized;
    }
  }
};
</script>

<style lang="scss">
.markdown-view {
  overflow-wrap: break-word;
}
</style>
