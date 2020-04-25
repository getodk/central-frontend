<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <page-head>
      <template #title>System Management</template>
      <template #tabs>
        <li :class="tabClass('backups')" role="presentation">
          <router-link :to="tabPath('backups')">Backups</router-link>
        </li>
        <li :class="tabClass('audits')" role="presentation">
          <router-link :to="tabPath('audits')">Server Audit Logs</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <router-view/>
    </page-body>
  </div>
</template>

<script>
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import tab from '../../mixins/tab';

export default {
  name: 'SystemHome',
  components: { PageBody, PageHead },
  mixins: [tab()],
  computed: {
    tabPathPrefix() {
      return '/system';
    }
  }
};
</script>
