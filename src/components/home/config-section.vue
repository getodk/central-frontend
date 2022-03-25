<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="home-config-section" horizontal>
    <template #heading>
      <span>{{ title }}</span>
    </template>
    <template #body>
      <markdown-view :raw-markdown="body"/>
    </template>
  </page-section>
</template>

<script>
import MarkdownView from '../markdown/view.vue';
import PageSection from '../page/section.vue';

export default {
  name: 'HomeConfigSection',
  components: { MarkdownView, PageSection },
  props: {
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    }
  }
};
</script>

<style lang="scss">
#home-config-section { margin-bottom: 0; }
</style>
