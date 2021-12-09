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
    <page-head v-show="project != null">
      <template v-if="project != null" #title>
        {{ project.nameWithArchived() }}
      </template>
      <template #tabs>
        <!-- Everyone with access to the project should be able to navigate to
        the project overview. -->
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">{{ $t('common.tab.overview') }}</router-link>
        </li>
        <li v-if="canRoute(tabPath('users'))" :class="tabClass('users')"
          role="presentation">
          <router-link :to="tabPath('users')">
            {{ $t('resource.projectRoles') }}
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('app-users'))" :class="tabClass('app-users')"
          role="presentation">
          <router-link :to="tabPath('app-users')">
            {{ $t('resource.appUsers') }}
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('form-access'))"
          :class="tabClass('form-access')" role="presentation">
          <router-link :to="tabPath('form-access')">
            {{ $t('projectShow.tab.formAccess') }}
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('settings'))" :class="tabClass('settings')"
          role="presentation">
          <router-link :to="tabPath('settings')">
            {{ $t('common.tab.settings') }}
          </router-link>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="$store.getters.initiallyLoading(['project'])"/>
      <!-- <router-view> may send its own requests before the server has
      responded to ProjectShow's request for the project. -->
      <router-view v-show="project != null" @fetch-project="fetchProject"
        @fetch-forms="fetchForms" @fetch-field-keys="fetchFieldKeys"/>
    </page-body>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import reconcileData from '../../store/modules/request/reconcile';
import routes from '../../mixins/routes';
import tab from '../../mixins/tab';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

reconcileData.add(
  'project', 'forms',
  (project, forms, commit) => {
    if (project.forms !== forms.length) {
      commit('setData', {
        key: 'project',
        value: project.with({ forms: forms.length })
      });
    }
  }
);
reconcileData.add(
  'project', 'fieldKeys',
  (project, fieldKeys, commit) => {
    if (project.appUsers !== fieldKeys.length) {
      commit('setData', {
        key: 'project',
        value: project.with({ appUsers: fieldKeys.length })
      });
    }
  }
);

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
  created() {
    this.fetchProject(false);
  },
  methods: {
    fetchProject(resend) {
      this.$store.dispatch('get', [{
        key: 'project',
        url: apiPaths.project(this.projectId),
        extended: true,
        resend
      }]).catch(noop);
    },
    fetchForms(resend) {
      this.$store.dispatch('get', [{
        key: 'forms',
        url: apiPaths.forms(this.projectId),
        extended: true,
        resend
      }]).catch(noop);
    },
    fetchFieldKeys(resend) {
      this.$store.dispatch('get', [{
        key: 'fieldKeys',
        url: apiPaths.fieldKeys(this.projectId),
        extended: true,
        resend
      }]).catch(noop);
    }
  }
};
</script>
