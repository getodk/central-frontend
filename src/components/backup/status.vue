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
  <div id="backup-status">
    <span id="backup-status-icon" :class="iconClass"></span>

    <template v-if="status === 'notConfigured'">
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
    <template v-else-if="status === 'neverRun'">
      <p>The configured backup has not yet run.</p>
      <p>
        If you have configured backups within the last couple of days, this is
        normal. Otherwise, something has gone wrong.
      </p>
      <p>
        In that case, the most likely fixes are to <strong>terminate</strong>
        the connection and set it up again, or to restart the service. If you
        are having trouble, please try the
        <a href="https://forum.getodk.org/" target="_blank">community forum</a>.
      </p>
    </template>
    <template v-else-if="status === 'somethingWentWrong'">
      <p>Something is wrong!</p>
      <p>
        The latest backup that completed successfully was <strong>more than
        three days ago.</strong>
      </p>
      <p>
        The most likely fixes are to <strong>terminate</strong> the connection
        and set it up again, or to restart the service. If you are having
        trouble, please try the
        <a href="https://forum.getodk.org/" target="_blank">community forum</a>.
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

    <button v-if="status === 'notConfigured'" type="button"
      class="btn btn-primary" @click="$emit('create')">
      <span class="icon-plus-circle"></span>Set up now&hellip;
    </button>
    <button v-else type="button" class="btn btn-primary"
      @click="$emit('terminate')">
      <span class="icon-times-circle"></span>Terminate&hellip;
    </button>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { mapGetters } from 'vuex';

import { ago, formatDate } from '../../util/date-time';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupStatus',
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['backupsConfig']),
    ...mapGetters(['auditsForBackupsConfig']),
    status() {
      if (this.backupsConfig.isEmpty()) return 'notConfigured';
      const latestAudit = this.auditsForBackupsConfig[0];
      // The earliest DateTime that is still considered recent for the purposes
      // of this component
      const recentThreshold = ago({ days: 3 });
      // No recent backup attempt
      if (latestAudit == null ||
        DateTime.fromISO(latestAudit.loggedAt) < recentThreshold) {
        const setAt = DateTime.fromISO(this.backupsConfig.get().setAt);
        return setAt < recentThreshold ? 'somethingWentWrong' : 'neverRun';
      }
      return latestAudit.details.success ? 'success' : 'somethingWentWrong';
    },
    iconClass() {
      switch (this.status) {
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
      return formatDate(this.auditsForBackupsConfig[0].loggedAt);
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
