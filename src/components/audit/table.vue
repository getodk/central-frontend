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
