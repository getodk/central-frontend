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
    </template>
    <backup-new v-bind="newBackup" @hide="hideModal('newBackup')"
      @success="afterCreate"/>
    <backup-terminate v-bind="terminate" @hide="hideModal('terminate')"
      @success="afterTerminate"/>
  </div>
</template>

<script>
import BackupNew from './new.vue';
import BackupTerminate from './terminate.vue';
import BackupStatus from './status.vue';
import BackupsConfig from '../../presenters/backups-config';
import modal from '../../mixins/modal';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupList',
  components: { BackupNew, BackupStatus, BackupTerminate },
  mixins: [modal()],
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
  computed: requestData(['backupsConfig']),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'backupsConfig',
        url: '/config/backups',
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404
      }]).catch(noop);
    },
    afterCreate() {
      this.fetchData();
      this.hideModal('newBackup');
      this.$alert().success('Success! Automatic backups are now configured.');
    },
    afterTerminate() {
      this.$alert().success('Your automatic backups were terminated. I recommend you set up a new one as soon as possible.');
      this.$store.commit('setData', {
        key: 'backupsConfig',
        value: BackupsConfig.notConfigured()
      });
    }
  }
};
</script>
