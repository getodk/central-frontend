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
  <!-- There is no .empty-table-message, but the table should also never be
  empty. -->
  <table id="audit-table" class="table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Type</th>
        <th>Initiator</th>
        <th>Target</th>
        <th class="details">Details</th>
      </tr>
    </thead>
    <tbody v-if="audits != null">
      <audit-row v-for="audit of audits" :key="audit.key" :audit="audit"/>
    </tbody>
  </table>
</template>

<script>
import AuditRow from './row.vue';

export default {
  name: 'AuditTable',
  components: { AuditRow },
  props: {
    audits: Array // eslint-disable-line vue/require-default-prop
  }
};
</script>

<style lang="scss">
#audit-table {
  table-layout: fixed;
}

#audit-table th.details {
  width: 33.33333333%;
}
</style>
