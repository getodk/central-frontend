<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="project-overview-right-now">
    <template #heading>
      <span>Right Now</span>
    </template>
    <template #body>
      <summary-item :route-to="projectPath('app-users')" icon="user-circle">
        <template #heading>
          {{ project.appUsers.toLocaleString() }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <strong>{{ $pluralize('App User', project.appUsers) }}</strong> who
          can use a data collection client to download and submit Form data to
          this Project.
        </template>
      </summary-item>
      <summary-item clickable icon="file-text"
        @click="$emit('scroll-to-forms')">
        <template #heading>
          {{ forms.length.toLocaleString() }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <strong>{{ $pluralize('Form', forms.length) }}</strong> which can be
          downloaded and given as surveys on mobile clients.
        </template>
      </summary-item>
    </template>
  </page-section>
</template>

<script>
import PageSection from '../../page/section.vue';
import SummaryItem from '../../summary-item.vue';
import router from '../../../mixins/router';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectOverviewRightNow',
  components: { PageSection, SummaryItem },
  mixins: [router()],
  computed: requestData(['project', 'forms'])
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
