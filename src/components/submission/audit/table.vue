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
  <table id="submission-audit-table" class="table">
    <thead>
      <tr>
        <th>{{ $t('header.time') }}</th>
        <th>{{ $t('header.takenBy') }}</th>
        <th>{{ $t('header.action') }}</th>
        <th class="notes">{{ $t('header.note') }}</th>
      </tr>
    </thead>
    <tbody v-if="audits != null">
      <submission-audit-row v-for="audit of audits" :key="audit.key"
        :audit="audit"/>
    </tbody>
  </table>
</template>

<script>
import SubmissionAuditRow from './row.vue';

import { requestData } from '../../../store/modules/request';

export default {
  name: 'SubmissionAuditTable',
  components: { SubmissionAuditRow },
  computed: requestData(['audits'])
};
</script>

<style lang="scss">
#submission-audit-table {
  table-layout: fixed;
  th.notes { width: 50%; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      "takenBy": "Taken by",
      "action": "Action",
      "note": "Note"
    }
  }
}
</i18n>
