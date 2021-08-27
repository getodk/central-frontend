<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="analytics-preview" :state="state" hideable backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <loading :state="$store.getters.initiallyLoading(['analyticsPreview'])"/>
      <template v-if="analyticsPreview">
        <analytics-metrics-table title="system" :summary="systemSummary"/>
        <h4>Project Summary</h4>
        <p>Showing 1 project of {{ numProjects }}</p>
        <!--<div style="display: flex">-->
          <analytics-metrics-table title="users" :summary="userSummary"/>
          <analytics-metrics-table title="forms" :summary="formSummary"/>
          <analytics-metrics-table title="submissions" :summary="submissionSummary"/>
        <!--</div>-->
      </template>
      <!--<pre v-if="analyticsPreview != null"><code>{{ formattedJson }}</code></pre>-->
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import AnalyticsMetricsTable from './metrics-table.vue';

import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'AnalyticsPreview',
  components: { AnalyticsMetricsTable, Loading, Modal },
  props: {
    state: Boolean
  },
  computed: {
    ...requestData(['analyticsPreview']),
    formattedJson() {
      return JSON.stringify(this.analyticsPreview, null, 2);
    },
    systemSummary() {
      return this.analyticsPreview.system;
    },
    firstProject() {
      return this.analyticsPreview.projects[0];
    },
    userSummary() {
      return this.firstProject.users;
    },
    formSummary() {
      return this.firstProject.forms;
    },
    submissionSummary() {
      return this.firstProject.submissions;
    },
    numProjects() {
      return this.analyticsPreview.projects.length;
    }
  },
  watch: {
    state(state) {
      if (state) this.fetchData();
    }
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'analyticsPreview',
        url: '/v1/analytics/preview'
      }]).catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#analytics-preview {
  .metric-value {
    text-align: right;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Anonymized Metrics Report",
    "introduction": [
      "Thank you for thinking about sending some usage information. This data will help us prioritize your needs!",
      "Shown here is the report we are collecting currently. To respond to new features and needs, we will sometimes change what is reported, but we will only ever gather summary averages like you see here.",
      "You can always come here to see what is being collected."
    ]
  }
}
</i18n>
