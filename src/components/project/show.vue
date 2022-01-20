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
      <loading :state="initiallyLoading"/>
      <!-- <router-view> may send its own requests before the server has
      responded to ProjectShow's request for the project. -->
      <router-view v-show="project != null" @fetch-project="fetchProject"
        @fetch-forms="fetchForms" @fetch-field-keys="fetchFieldKeys"/>
    </page-body>
  </div>
</template>

<script>
import { computed, inject, watchSyncEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { usePaths } from '../../reusables/paths';
import { useTabs } from '../../reusables/tabs';

export default {
  name: 'ProjectShow',
  components: { Loading, PageBody, PageHead },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const requestData = inject('requestData');
    const { project, forms, fieldKeys } = requestData;

    const fetchProject = (resend) => project.request({
      url: apiPaths.project(props.projectId),
      extended: true,
      resend
    }).catch(noop);
    fetchProject(false);
    const initiallyLoading = requestData.initiallyLoading(['project']);

    const fetchForms = (resend) => forms.request({
      url: apiPaths.forms(props.projectId),
      extended: true,
      resend
    }).catch(noop);
    watchSyncEffect(() => {
      if (project.data != null && forms.data != null &&
        project.data.forms !== forms.data.length)
        project.update({ forms: forms.data.length });
    });

    const fetchFieldKeys = (resend) => fieldKeys.request({
      url: apiPaths.fieldKeys(props.projectId),
      extended: true,
      resend
    }).catch(noop);
    watchSyncEffect(() => {
      if (project.data != null && fieldKeys.data != null &&
        project.data.appUsers !== fieldKeys.data.length)
        project.update({ appUsers: fieldKeys.data.length });
    });

    const { projectPath } = usePaths(useRouter());
    const tabs = useTabs(useRoute(), computed(projectPath));

    return {
      t: useI18n().t,
      initiallyLoading, fetchProject, fetchForms, fetchFieldKeys,
      ...tabs
    };
  }
};
</script>
