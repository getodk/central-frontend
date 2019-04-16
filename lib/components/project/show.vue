<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <page-head v-show="project != null">
      <template v-if="project != null" slot="title">
        {{ project.name }} {{ project.archived ? '(archived)' : '' }}
      </template>
      <template slot="tabs">
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li :class="tabClass('users')" role="presentation">
          <router-link :to="tabPath('users')">Project Managers</router-link>
        </li>
        <li :class="tabClass('app-users')" role="presentation">
          <router-link :to="tabPath('app-users')">App Users</router-link>
        </li>
        <li :class="tabClass('settings')" role="presentation">
          <router-link :to="tabPath('settings')">Settings</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="$store.getters.initiallyLoading(['project'])"/>
      <!-- It might be possible to remove this <div> element and move the v-show
      to <keep-alive> or <router-view>. However, I'm not sure that <keep-alive>
      supports that use case. -->
      <div v-show="project != null">
        <!-- <router-view> is immediately created and can send its own requests
        even before the server has responded to ProjectHome's request for the
        project. -->
        <router-view/>
      </div>
    </page-body>
  </div>
</template>

<script>
import tab from '../../mixins/tab';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectShow',
  mixins: [tab()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  computed: requestData(['project']),
  methods: {
    tabPathPrefix() {
      return `/projects/${this.projectId}`;
    }
  }
};
</script>
