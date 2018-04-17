<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <page-head>
      <template slot="title">System Settings</template>
      <template slot="tabs">
        <li :class="tabClass('backups')" role="presentation">
          <router-link :to="tabPath('backups')">Backups</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <alert v-bind="alert" @close="alert.state = false"/>
      <keep-alive>
        <router-view @alert="hideAlert"/>
      </keep-alive>
    </page-body>
  </div>
</template>

<script>
import alert from '../../mixins/alert';
import tab from '../../mixins/tab';

export default {
  name: 'SystemHome',
  mixins: [alert(), tab()],
  data() {
    return {
      alert: alert.blank()
    };
  },
  methods: {
    tabPathPrefix() {
      return '/system';
    }
  }
};
</script>
