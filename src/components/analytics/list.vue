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
  <div>
    <div class="page-body-heading">
      <p>{{ $t('analytics.alwaysImprove') }}</p>
      <i18n tag="p" path="analytics.needFeedback.full">
        <template #your>
          <span>{{ $t('analytics.needFeedback.your') }}</span>
        </template>
      </i18n>
      <p>{{ $t('heading[0]') }}</p>
    </div>
    <loading :state="$store.getters.initiallyLoading(['analyticsConfig'])"/>
    <analytics-form v-if="analyticsConfig != null"/>
  </div>
</template>

<script>
import AnalyticsForm from './form.vue';
import Loading from '../loading.vue';

import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'AnalyticsList',
  components: { AnalyticsForm, Loading },
  computed: requestData(['analyticsConfig']),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'analyticsConfig',
        url: '/v1/config/analytics',
        fulfillProblem: ({ code }) => code === 404.1
      }]).catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "Below, you can choose whether this Central server will share anonymous usage information with the Central team. This setting affects the entire server."
    ]
  }
}
</i18n>
