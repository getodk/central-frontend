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
  <div id="backup-list">
    <loading :state="$store.getters.initiallyLoading(['backupsConfig'])"/>
    <div v-if="backups != null" class="panel panel-simple">
      <div class="panel-heading">
        <h1 class="panel-title">Current Status</h1>
      </div>
      <div class="panel-body">
        <div id="backup-list-status-icon-container">
          <span :class="iconClass"></span>
        </div>
        <div id="backup-list-button-container">
          <button v-if="backups.status === 'notConfigured'"
            id="backup-list-new-button" type="button" class="btn btn-primary"
            @click="showModal('newBackup')">
            <span class="icon-plus-circle"></span>Set up now
          </button>
          <button v-else id="backup-list-terminate-button" type="button"
            class="btn btn-primary" @click="showModal('terminate')">
            <span class="icon-times-circle"></span>Terminate
          </button>
        </div>
        <div id="backup-list-status-message">
          <template v-if="backups.status === 'notConfigured'">
            <p>Backups are not configured.</p>
            <p>
              <strong>The data server has not been set up to automatically
              back up its data anywhere.</strong>
            </p>
            <p>
              Unless you have set up some other form of data backup that I
              don’t know about, it is <strong>strongly recommended</strong>
              that you do this now. If you are not sure, it is best to do it
              just to be safe.
            </p>
            <p>
              Automatic data backups happen through this system once a day.
              All your data is encrypted with a password you provide so that
              only you can unlock it.
            </p>
          </template>
          <template v-else-if="backups.status === 'neverRun'">
            <p>The configured backup has not yet run.</p>
            <p>
              If you have configured backups within the last couple of days,
              this is normal. Otherwise, something has gone wrong.
            </p>
            <p>
              In that case, the most likely fixes are to
              <strong>terminate</strong> the connection and set it up again,
              or to restart the service. If you are having trouble, please try
              the
              <a href="https://forum.opendatakit.org/" target="_blank">community forum</a>.
            </p>
          </template>
          <template v-else-if="backups.status === 'somethingWentWrong'">
            <p>Something is wrong!</p>
            <p>
              The latest backup that completed successfully was <strong>more
              than three days ago.</strong>
            </p>
            <p>
              The most likely fixes are to <strong>terminate</strong> the
              connection and set it up again, or to restart the service. If
              you are having trouble, please try the
              <a href="https://forum.opendatakit.org/" target="_blank">community forum</a>.
            </p>
          </template>
          <template v-else>
            <p>Backup is working.</p>
            <p>
              The last backup completed successfully
              <strong id="backup-list-most-recently-logged-at">
              {{ mostRecentlyLoggedAt }}</strong>.
            </p>
          </template>
        </div>
      </div>
    </div>

    <backup-new v-bind="newBackup" @hide="hideModal('newBackup')"
      @success="afterCreate"/>
    <backup-terminate v-bind="terminate" @hide="hideModal('terminate')"
      @success="afterTerminate"/>
  </div>
</template>

<script>
import BackupNew from './new.vue';
import BackupTerminate from './terminate.vue';
import BackupsConfig from '../../presenters/backups-config';
import modal from '../../mixins/modal';
import { formatDate } from '../../util/util';

export default {
  name: 'BackupList',
  components: { BackupNew, BackupTerminate },
  mixins: [modal(['newBackup', 'terminate'])],
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
  computed: {
    backups() {
      return this.$store.state.request.data.backupsConfig;
    },
    iconClass() {
      switch (this.backups.status) {
        case 'notConfigured':
          return 'icon-question-circle';
        case 'neverRun':
        case 'success':
          return 'icon-check-circle';
        default: // 'somethingWentWrong'
          return 'icon-times-circle';
      }
    },
    mostRecentlyLoggedAt() {
      return this.backups.recent.length !== 0
        ? formatDate(this.backups.recent[0].loggedAt)
        : null;
    }
  },
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
      }]).catch(() => {});
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

<style lang="sass">
@import '../../../assets/scss/variables';

$title-font-size: 28px;

#backup-list .panel-body {
  padding-top: 10px;
}

#backup-list-status-icon-container {
  position: relative;

  span {
    font-size: 32px;
    position: absolute;
    top: 4px;
  }

  .icon-question-circle {
    color: #999;
  }

  .icon-check-circle {
    color: $color-success;
  }

  .icon-times-circle {
    color: $color-danger;
  }
}

#backup-list-button-container {
  float: right;
  // Setting font-size to $title-font-size so that the button is vertically
  // aligned correctly.
  font-size: $title-font-size;
}

#backup-list-status-message {
  p {
    margin-left: 41px;

    &:first-child {
      font-size: $title-font-size;
    }
  }
}
</style>
