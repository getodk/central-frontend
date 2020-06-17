<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="project-overview-right-now">
    <template #heading>
      <span>{{ $t('common.rightNow') }}</span>
    </template>
    <template #body>
      <summary-item :route-to="projectPath('app-users')" icon="user-circle">
        <template #heading>
          {{ $n(project.appUsers, 'default') }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <i18n tag="p" :path="$tcPath('appUsers.full', project.appUsers)">
            <template #appUsers>
              <strong>{{ $tc('appUsers.appUsers', project.appUsers) }}</strong>
            </template>
          </i18n>
        </template>
      </summary-item>
      <summary-item clickable icon="file-text"
        @click="$emit('scroll-to-forms')">
        <template #heading>
          {{ $n(project.forms, 'default') }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <i18n tag="p" :path="$tcPath('forms.full', project.forms)">
            <template #forms>
              <strong>{{ $tc('forms.forms', project.forms) }}</strong>
            </template>
          </i18n>
        </template>
      </summary-item>
    </template>
  </page-section>
</template>

<script>
import PageSection from '../../page/section.vue';
import SummaryItem from '../../summary-item.vue';
import routes from '../../../mixins/routes';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectOverviewRightNow',
  components: { PageSection, SummaryItem },
  mixins: [routes()],
  computed: requestData(['project'])
};
</script>

<style lang="scss">
#project-overview-right-now .icon-file-text {
  // .icon-file-text is a little more narrow than .icon-user-circle, so we use
  // this to center it.
  margin-left: 4px;
  margin-right: 4px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "appUsers": {
      // The count of App Users is shown separately above this text.
      "full": [
        "{appUsers} who can use a data collection client to download and submit Form data to this Project.",
        "{appUsers} who can use a data collection client to download and submit Form data to this Project."
      ],
      "appUsers": "App User | App Users"
    },
    "forms": {
      // The count of Forms is shown separately above this text.
      "full": [
        "{forms} which can be downloaded and given as surveys on mobile clients.",
        "{forms} which can be downloaded and given as surveys on mobile clients."
      ],
      "forms": "Form | Forms"
    }
  }
}
</i18n>
