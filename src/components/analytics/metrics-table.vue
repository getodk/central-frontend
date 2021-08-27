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
  <div class="metrics-table">
    <table class="table metric-table">
      <thead>
        <tr>
          <th class="sectionTitle">{{ $t(title) }}</th>
          <th class="metric-value">{{ $t('recent') }}</th>
          <th class="metric-value">{{ $t('total') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(value, name) in summary" :key="value" class="metric-row">
          <td><b>{{ $t(name) }}</b></td>
          <template v-if="value.recent != null">
            <td class="metric-value">{{ value.recent }}</td>
            <td class="metric-value">{{ value.total }}</td>
          </template>
          <template v-else>
            <td colspan="2" class="metric-value">{{ value }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsMetricsTable',
  props: {
    title: {
      type: String,
      required: true
    },
    summary: {
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


</style>

<i18n lang="json5">
{
  "en": {
    "system": "System Summary",
    "num_admins": "Number of Administrators",
    "recent": "in the past 45 days",
    "total": "Total",
    "num_projects_encryption": "Number of projects with encryption enabled",
    "num_questions_biggest_form": "Number of questions in biggest form",
    "num_audit_log_entries": "Number of audit log entries",
    "backups_configured": "Backups configured",
    "database_size": "System database size",
    "projects": "Project Details",
    "users": "User Summary",
    "num_managers": "Number of project managers",
    "num_viewers": "Number of project viewers",
    "num_data_collectors": "Number of data collectors",
    "num_app_users": "Number of app users",
    "num_device_ids": "Number of device ids",
    "num_public_access_links": "Number of public access links",
    "forms": "Form Summary",
    "num_forms": "Number of forms",
    "num_forms_with_repeats": "Number of forms with repeats",
    "num_forms_with_geospatial": "Number of forms with geospatial",
    "num_forms_with_encryption": "Number of forms with encryption",
    "num_forms_with_audits": "Number of forms with audits",
    "submissions": "Submission Summary",
    "num_submissions_received": "Number of submissions received",
    "num_submissions_approved": "Number of submissions approved",
    "num_submissions_has_issues": "Number of submissions has issues",
    "num_submissions_rejected": "Number of submissions rejected",
    "num_submissions_with_edits": "Number of submissions with edits",
    "num_submissions_with_comments": "Number of submissions with comments",
    "num_submissions_from_app_users": "Number of submissions from app users",
    "num_submissions_from_public_links": "Number of submissions from public links",
    "num_submissions_from_web_users": "Number of submissions from web users"
  }
}
</i18n>
