<!--
Copyright 2019 ODK Central Developers
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
    <p id="audit-list-heading">{{ $t('heading[0]') }}</p>
    <audit-filters v-bind.sync="filters"/>
    <audit-table :audits="audits"/>
    <loading :state="$store.getters.initiallyLoading(['audits'])"/>
    <p v-show="audits != null && audits.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
  </div>
</template>

<script>
import { DateTime } from 'luxon';

import AuditFilters from './filters.vue';
import AuditTable from './table.vue';
import Loading from '../loading.vue';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'AuditList',
  components: { AuditFilters, AuditTable, Loading },
  mixins: [validateData({ update: false })],
  data() {
    const today = DateTime.local().startOf('day');
    return {
      filters: {
        action: 'nonverbose',
        dateRange: [today, today]
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['audits']),
  watch: {
    filters: {
      handler: 'fetchData',
      deep: true
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const { action, dateRange } = this.filters;
      this.$store.dispatch('get', [{
        key: 'audits',
        url: apiPaths.audits({
          action,
          start: dateRange[0].toISO(),
          end: dateRange[1].endOf('day').toISO()
        }),
        extended: true
      }]).catch(noop);
    }
  }
};
</script>

<style lang="scss">
#audit-list-heading {
  margin-bottom: 20px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "Here you will find a log of significant actions performed on this server. Changes made to user, Project, or Form settings can be found here."
    ],
    "emptyTable": "There are no matching audit log entries."
  }
}
</i18n>
