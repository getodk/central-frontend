<!--
Copyright 2017 ODK Central Developers
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
    <loading :state="$store.getters.initiallyLoading(['backupsConfig'])"/>
    <template v-if="backupsConfig != null">
      <backup-status @create="showModal('newBackup')"
        @terminate="showModal('terminate')"/>
      <page-section v-if="audits != null && audits.length !== 0">
        <template #heading>
          <span>Latest Backups</span>
        </template>
        <template #body>
          <audit-table :audits="audits"/>
        </template>
      </page-section>
    </template>
    <backup-new v-bind="newBackup" @hide="hideModal('newBackup')"
      @success="afterCreate"/>
    <backup-terminate v-bind="terminate" @hide="hideModal('terminate')"
      @success="afterTerminate"/>
  </div>
</template>

<script>
import AuditTable from '../audit/table.vue';
import BackupNew from './new.vue';
import BackupTerminate from './terminate.vue';
import BackupStatus from './status.vue';
import BackupsConfig from '../../presenters/backups-config';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupList',
  components: {
    AuditTable,
    BackupNew,
    BackupStatus,
    BackupTerminate,
    Loading,
    PageSection
  },
  mixins: [modal(), validateData({ update: false })],
  data() {
    return {
      newBackup: {
        state: false
      },
      terminate: {
        state: false
      }
    };
  },
  computed: requestData(['backupsConfig', 'audits']),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [
        {
          key: 'backupsConfig',
          url: '/config/backups',
          fulfillProblem: ({ code }) => code === 404.1
        },
        {
          key: 'audits',
          // A backup audit log entry does not have an actor or actee, so we do
          // not need to request extended metadata.
          url: apiPaths.audits({ action: 'backup', limit: 10 })
        }
      ]).catch(noop);
    },
    afterCreate() {
      this.fetchData();
      this.hideModal('newBackup');
      this.$alert().success('Success! Automatic backups are now configured.');
    },
    afterTerminate() {
      this.hideModal('terminate');
      this.$alert().success('Your automatic backups were terminated. I recommend you set up a new one as soon as possible.');
      this.$store.commit('setData', {
        key: 'backupsConfig',
        value: BackupsConfig.notConfigured()
      });
    }
  }
};
</script>
