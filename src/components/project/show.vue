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
        <!-- Everyone with access to the project should be able to navigate to
        ProjectOverview. -->
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">Overview</router-link>
        </li>
        <li v-if="canRoute(tabPath('users'))" :class="tabClass('users')"
          role="presentation">
          <router-link :to="tabPath('users')">Project Roles</router-link>
        </li>
        <li v-if="canRoute(tabPath('app-users'))" :class="tabClass('app-users')"
          role="presentation">
          <router-link :to="tabPath('app-users')">App Users</router-link>
        </li>
        <li v-if="canRoute(tabPath('form-access'))"
          :class="tabClass('form-access')" role="presentation">
          <router-link :to="tabPath('form-access')">Form Access</router-link>
        </li>
        <li v-if="canRoute(tabPath('settings'))" :class="tabClass('settings')"
          role="presentation">
          <router-link :to="tabPath('settings')">Settings</router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="$store.getters.initiallyLoading(['project'])"/>
      <!-- <router-view> is immediately created and can send its own requests
      even before the server has responded to ProjectHome's request for the
      project. -->
      <router-view v-show="project != null"
        @fetch-project="$emit('fetch-project')" @fetch-forms="fetchForms"
        @fetch-field-keys="fetchFieldKeys"/>
    </page-body>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import routes from '../../mixins/routes';
import tab from '../../mixins/tab';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectShow',
  components: { Loading, PageBody, PageHead },
  mixins: [routes(), tab()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...requestData(['project']),
    tabPathPrefix() {
      return this.projectPath();
    }
  },
  methods: {
    // Note that we do not keep project.forms and forms.length in sync.
    fetchForms(resend = undefined) {
      this.$store.dispatch('get', [{
        key: 'forms',
        url: apiPaths.forms(this.projectId),
        extended: true,
        resend
      }]).catch(noop);
    },
    fetchFieldKeys(resend = undefined) {
      this.$store.dispatch('get', [{
        key: 'fieldKeys',
        url: apiPaths.fieldKeys(this.projectId),
        extended: true,
        resend,
        success: ({ project, fieldKeys }) => {
          if (project == null || project.appUsers === fieldKeys.length) return;
          this.$store.commit('setData', {
            key: 'project',
            value: project.with({ appUsers: fieldKeys.length })
          });
        }
      }]).catch(noop);
    }
  }
};
</script>
