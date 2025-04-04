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
    <breadcrumbs v-if="project.dataExists" :links="breadcrumbLinks"/>
    <page-head v-show="project.dataExists">
      <template v-if="project.dataExists" #title>
        {{ project.nameWithArchived }}
      </template>
      <template #description>
        <project-overview-description v-if="project.dataExists"
        :description="project.description" :can-update="canUpdate"/>
      </template>
        <template #tabs>
        <!-- Everyone with access to the project should be able to navigate to
        the forms page. -->
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">
            {{ $t('resource.forms') }}
            <span v-if="project.dataExists" class="badge">
              {{ $n(project.forms, 'default') }}
            </span>
          </router-link>
        </li>
        <li v-if="canRoute(tabPath('entity-lists'))" :class="tabClass('entity-lists')"
          role="presentation">
          <router-link :to="tabPath('entity-lists')">
            {{ $t('resource.entityLists') }}
            <span v-if="project.dataExists" class="badge">
              {{ $n(project.datasets, 'default') }}
            </span>
          </router-link>
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
      <loading :state="project.initiallyLoading"/>
      <!-- <router-view> may send its own requests before the server has
      responded to ProjectShow's request for the project. -->
      <router-view v-show="project.dataExists" @fetch-project="fetchProject"
        @fetch-forms="fetchForms" @fetch-field-keys="fetchFieldKeys"/>
    </page-body>
  </div>
</template>

<script>
import Breadcrumbs from '../breadcrumbs.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import ProjectOverviewDescription from './overview/description.vue';

import useDatasets from '../../request-data/datasets';
import useProject from '../../request-data/project';
import useRoutes from '../../composables/routes';
import useTabs from '../../composables/tabs';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'ProjectShow',
  components: { Breadcrumbs, Loading, PageBody, PageHead, ProjectOverviewDescription },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { project, forms, fieldKeys } = useProject();
    const datasets = useDatasets();
    const { projectPath, canRoute } = useRoutes();
    const { tabPath, tabClass } = useTabs(projectPath());
    return {
      project, forms, datasets, fieldKeys,
      tabPath, tabClass, projectPath, canRoute
    };
  },
  computed: {
    breadcrumbLinks() {
      return [
        { text: this.project.dataExists ? this.project.nameWithArchived : this.$t('resource.project'), path: this.projectPath(), icon: 'icon-archive' }
      ];
    },
    canUpdate() {
      return this.project.dataExists && this.project.permits('project.update');
    }
  },
  created() {
    this.fetchProject(false);
  },
  methods: {
    fetchProject(resend) {
      this.project.request({
        url: apiPaths.project(this.projectId),
        extended: true,
        resend
      }).catch(noop);
    },
    fetchForms(resend) {
      this.forms.request({
        url: apiPaths.forms(this.projectId),
        extended: true,
        resend
      }).catch(noop);

      // If we send a request for this.forms, then we also clear this.datasets
      // in case a change to this.forms has also changed this.datasets.
      if (!this.forms.dataExists) this.datasets.data = null;
    },
    fetchFieldKeys(resend) {
      this.fieldKeys.request({
        url: apiPaths.fieldKeys(this.projectId),
        extended: true,
        resend
      }).catch(noop);
    }
  }
};
</script>
