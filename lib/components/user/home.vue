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
      <template slot="title">Users</template>
      <template slot="body">
        Web Users can log into this website to perform administrative tasks,
        while App Users can use mobile clients (like
        <doc-link to="collect-intro/">Collect</doc-link>)
        to download, fill out, and submit forms.
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Web Users</router-link>
        </li>
        <li :class="tabClass('field-keys')" role="presentation">
          <router-link :to="tabPath('field-keys')">App Users</router-link>
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
  name: 'UserHome',
  mixins: [alert(), tab()],
  data() {
    return {
      alert: alert.blank()
    };
  },
  methods: {
    tabPathPrefix() {
      return '/users';
    }
  }
};
</script>
