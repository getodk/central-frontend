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
  <table class="table analytics-metrics-table">
    <thead>
      <tr>
        <th>{{ title }}</th>
        <th class="metric-value recent-col">{{ $t('analytics.metricsTable.recent') }}</th>
        <th class="metric-value">{{ $t('analytics.metricsTable.total') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(value, name) in metrics" :key="name">
        <td>{{ $t(`analytics.metricsTable.${name}`) }}</td>
        <template v-if="value.recent != null">
          <td class="metric-value">{{ $n(value.recent) }}</td>
          <td class="metric-value">{{ $n(value.total) }}</td>
        </template>
        <template v-else>
          <td colspan="2" class="metric-value">{{ $n(value) }}</td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: 'AnalyticsMetricsTable',
  props: {
    title: {
      type: String,
      required: true
    },
    metrics: {
      type: Object,
      required: true
    }
  },
  computed: {
  },
  methods: {
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.analytics-metrics-table {
  .metric-value {
    text-align: right;
  }

  .recent-col {
    width: 130px;
  }
}

</style>
