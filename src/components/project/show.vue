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
      <template v-if="project != null" #title>
        {{ project.name }} {{ project.archived ? '(archived)' : '' }}
      </template>
      <template #tabs>
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li :class="tabClass('users')" role="presentation">
          <router-link :to="tabPath('users')">Project Managers</router-link>
        </li>
        <li :class="tabClass('app-users')" role="presentation">
          <router-link :to="tabPath('app-users')">App Users</router-link>
        </li>
        <li :class="tabClass('form-workflow')" role="presentation">
          <router-link :to="tabPath('form-workflow')">Form Workflow</router-link>
        </li>
        <li v-if="project != null && !project.archived"
          :class="tabClass('settings')" role="presentation">
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
        <router-view @fetch-project="$emit('fetch-project')"
          @fetch-forms="fetchForms" @fetch-field-keys="fetchFieldKeys"/>
      </div>
    </page-body>
  </div>
</template>

<script>
import tab from '../../mixins/tab';
import { noop } from '../../util/util';
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
  computed: {
    ...requestData(['project']),
    tabPathPrefix() {
      return `/projects/${this.projectId}`;
    }
  },
  methods: {
    // Note that we do not keep project.forms and forms.length in sync.
    fetchForms(resend = undefined) {
      this.$store.dispatch('get', [{
        key: 'forms',
        url: `/projects/${this.projectId}/forms`,
        extended: true,
        resend
      }]).catch(noop);
    },
    fetchFieldKeys(resend = undefined) {
      this.$store.dispatch('get', [{
        key: 'fieldKeys',
        url: `/projects/${this.projectId}/app-users`,
        extended: true,
        resend,
        success: ({ project, fieldKeys }) => {
          if (project == null || project.appUsers === fieldKeys.length) return;
          this.$store.commit('setData', {
            key: 'project',
            value: { ...project, appUsers: fieldKeys.length }
          });
        }
      }]).catch(noop);
    }
  }
};
</script>
