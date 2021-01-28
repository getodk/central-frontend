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
  <page-body>
    <i18n tag="p" path="body">
      <template #filename>
        <strong>{{ filename }}</strong>
      </template>
    </i18n>
    <a v-show="false" ref="link" :href="href" download></a>
  </page-body>
</template>

<script>
import PageBody from './page/body.vue';

export default {
  name: 'Download',
  components: { PageBody },
  computed: {
    filename() {
      const { path } = this.$route;
      return path.slice(path.lastIndexOf('/') + 1);
    },
    href() {
      return this.$route.fullPath.replace('/dl', '/v1');
    }
  },
  watch: {
    $route() {
      this.$nextTick(this.download);
    }
  },
  mounted() {
    this.download();
  },
  methods: {
    download() {
      this.$refs.link.click();
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "body": "{filename} will begin downloading soon. Once the download begins, you can leave this page."
  }
}
</i18n>
