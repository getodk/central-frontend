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
        <th class="metric-value recent-col">{{ $t('recent') }}</th>
        <th class="metric-value">{{ $t('common.total') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(value, name) in metrics" :key="name">
        <td>{{ $t(`fields.${name}`) }}</td>
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
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.analytics-metrics-table {
  .metric-value {
    text-align: right;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "recent": "in the past 45 days",
    "fields": {
      "num_admins": "Number of Administrators",
      "num_projects_encryption": "Number of Projects with encryption enabled",
      "num_questions_biggest_form": "Number of questions in biggest Form",
      "num_audit_log_entries": "Number of Audit Log entries",
      "backups_configured": "Backups configured",
      "database_size": "System database size",
      "num_managers": "Number of Project Managers",
      "num_viewers": "Number of Project Viewers",
      "num_data_collectors": "Number of Data Collectors",
      "num_app_users": "Number of App Users",
      "num_device_ids": "Number of device IDs",
      "num_public_access_links": "Number of Public Access Links",
      "num_forms": "Number of Forms",
      "num_forms_with_repeats": "Number of Forms with repeats",
      "num_forms_with_geospatial": "Number of Forms with geospatial",
      "num_forms_with_encryption": "Number of Forms with encryption",
      "num_forms_with_audits": "Number of Forms with audits",
      "num_submissions_received": "Number of Submissions received",
      "num_submissions_approved": "Number of Submissions approved",
      "num_submissions_has_issues": "Number of Submissions with issues",
      "num_submissions_rejected": "Number of Submissions rejected",
      "num_submissions_edited": "Number of Submissions in edited state",
      "num_submissions_with_edits": "Number of Submissions with edits",
      "num_submissions_with_comments": "Number of Submissions with comments",
      "num_submissions_from_app_users": "Number of Submissions from App Users",
      "num_submissions_from_public_links": "Number of Submissions from Public Links",
      "num_submissions_from_web_users": "Number of Submissions from Web Users"
    }
  }
}
</i18n>
