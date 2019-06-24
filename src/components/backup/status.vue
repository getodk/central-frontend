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
  <div id="backup-status">
    <span id="backup-status-icon" :class="iconClass"></span>

    <template v-if="backupsConfig.status === 'notConfigured'">
      <p>Backups are not configured.</p>
      <p>
        <strong>The data server has not been set up to automatically back up
        its data anywhere.</strong>
      </p>
      <p>
        Unless you have set up some other form of data backup that I
        don&rsquo;t know about, it is <strong>strongly recommended</strong>
        that you do this now. If you are not sure, it is best to do it just to
        be safe.
      </p>
      <p>
        Automatic data backups happen through this system once a day. All your
        data is encrypted with a password you provide so that only you can
        unlock it.
      </p>
    </template>
    <template v-else-if="backupsConfig.status === 'neverRun'">
      <p>The configured backup has not yet run.</p>
      <p>
        If you have configured backups within the last couple of days, this is
        normal. Otherwise, something has gone wrong.
      </p>
      <p>
        In that case, the most likely fixes are to <strong>terminate</strong>
        the connection and set it up again, or to restart the service. If you
        are having trouble, please try the
        <a href="https://forum.opendatakit.org/" target="_blank">
          community forum</a>.
      </p>
    </template>
    <template v-else-if="backupsConfig.status === 'somethingWentWrong'">
      <p>Something is wrong!</p>
      <p>
        The latest backup that completed successfully was <strong>more than
        three days ago.</strong>
      </p>
      <p>
        The most likely fixes are to <strong>terminate</strong> the connection
        and set it up again, or to restart the service. If you are having
        trouble, please try the
        <a href="https://forum.opendatakit.org/" target="_blank">
          community forum</a>.
      </p>
    </template>
    <template v-else>
      <p>Backup is working.</p>
      <p>
        The last backup completed successfully
        <strong id="backup-status-most-recently-logged-at">
        {{ mostRecentlyLoggedAt }}</strong>.
      </p>
    </template>

    <button v-if="backupsConfig.status === 'notConfigured'" type="button"
      class="btn btn-primary" @click="$emit('create')">
      <span class="icon-plus-circle"></span>Set up now
    </button>
    <button v-else type="button" class="btn btn-primary"
      @click="$emit('terminate')">
      <span class="icon-times-circle"></span>Terminate
    </button>
  </div>
</template>

<script>
import { formatDate } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupStatus',
  computed: {
    ...requestData(['backupsConfig']),
    iconClass() {
      switch (this.backupsConfig.status) {
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
      return formatDate(this.backupsConfig.recent[0].loggedAt);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#backup-status {
  margin-bottom: 35px;
  position: relative;

  p, button {
    margin-left: 41px;
  }

  p:first-of-type {
    font-size: 28px;
  }
}

#backup-status-icon {
  font-size: 32px;
  position: absolute;
  top: 4px;

  &.icon-question-circle {
    color: #999;
  }

  &.icon-check-circle {
    color: $color-success;
  }

  &.icon-times-circle {
    color: $color-danger;
  }
}
</style>
