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
  <div>
    <p id="audit-list-heading">
      Here you will find a log of significant actions performed on this server.
      Changes made to user, Project, or Form settings can be found here.
    </p>
    <audit-table :audits="audits"/>
    <loading :state="$store.getters.initiallyLoading(['audits'])"/>
  </div>
</template>

<script>
import AuditTable from './table.vue';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'AuditList',
  components: { AuditTable },
  computed: requestData(['audits']),
  created() {
    this.$store.dispatch('get', [{
      key: 'audits',
      url: '/audits?action=nonverbose',
      extended: true
    }]).catch(noop);
  }
};
</script>

<style lang="scss">
#audit-list-heading {
  margin-bottom: 20px;
}
</style>
