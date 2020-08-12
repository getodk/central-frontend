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
      <p>{{ $t('notConfigured[0]') }}</p>
      <p><strong>{{ $t('notConfigured[1]') }}</strong></p>
      <i18n tag="p" path="notConfigured[2].full">
        <template #recommended>
          <strong>{{ $t('notConfigured[2].recommended') }}</strong>
        </template>
      </i18n>
      <p>{{ $t('notConfigured[3]') }}</p>
    </template>
    <template v-else-if="status === 'neverRun'">
      <p>{{ $t('neverRun[0]') }}</p>
      <p>{{ $t('neverRun[1]') }}</p>
      <p>
        <i18n :tag="false" path="neverRun[2].full">
          <template #terminate>
            <strong>{{ $t('neverRun[2].terminate') }}</strong>
          </template>
        </i18n>
        &nbsp;
        <i18n :tag="false" path="getHelp.full">
          <template #forum>
            <a href="https://forum.getodk.org/" target="_blank">{{ $t('getHelp.forum') }}</a>
          </template>
        </i18n>
      </p>
    </template>
    <template v-else-if="status === 'somethingWentWrong'">
      <p>{{ $t('somethingWentWrong[0]') }}</p>
      <i18n tag="p" path="somethingWentWrong[1].full">
        <template #moreThanThreeDaysAgo>
          <strong>{{ $t('somethingWentWrong[1].moreThanThreeDaysAgo') }}</strong>
        </template>
      </i18n>
      <p>
        <i18n :tag="false" path="somethingWentWrong[2].full">
          <template #terminate>
            <strong>{{ $t('somethingWentWrong[2].terminate') }}</strong>
          </template>
        </i18n>
        &nbsp;
        <i18n :tag="false" path="getHelp.full">
          <template #forum>
            <a href="https://forum.getodk.org/" target="_blank">{{ $t('getHelp.forum') }}</a>
          </template>
        </i18n>
      </p>
    </template>
    <template v-else>
      <p>{{ $t('success[0]') }}</p>
      <i18n tag="p" path="success[1]">
        <template #dateTime>
          <strong id="backup-status-most-recently-logged-at">
            <date-time :iso="auditsForBackupsConfig[0].loggedAt"/>
          </strong>
        </template>
      </i18n>
    </template>

    <button v-if="status === 'notConfigured'" type="button"
      class="btn btn-primary" @click="$emit('create')">
      <span class="icon-plus-circle"></span>{{ $t('action.setUp') }}&hellip;
    </button>
    <button v-else type="button" class="btn btn-primary"
      @click="$emit('terminate')">
      <span class="icon-times-circle"></span>{{ $t('action.terminate') }}&hellip;
    </button>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { mapGetters } from 'vuex';

import DateTimeComponent from '../date-time.vue';
import { ago } from '../../util/date-time';
import { requestData } from '../../store/modules/request';

export default {
  name: 'BackupStatus',
  components: { DateTime: DateTimeComponent },
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

<i18n lang="json5">
{
  "en": {
    "getHelp": {
      "full": "If you are having trouble, please try the {forum}.",
      "forum": "community forum"
    },
    "notConfigured": [
      "Backups are not configured.",
      "The data server has not been set up to automatically back up its data anywhere.",
      {
        "full": "Unless you have set up some other form of data backup that the server doesn’t know about, it is {recommended} that you do this now. If you are not sure, it is best to do it just to be safe.",
        "recommended": "strongly recommended"
      },
      "Automatic data backups happen through this system once a day. All your data is encrypted with a password you provide so that only you can unlock it."
    ],
    "neverRun": [
      "The configured backup has not yet run.",
      "If you have configured backups within the last couple of days, this is normal. Otherwise, something has gone wrong.",
      {
        "full": "In that case, the most likely fixes are to {terminate} the connection and set it up again, or to restart the service.",
        "terminate": "terminate"
      }
    ],
    "somethingWentWrong": [
      "Something is wrong!",
      {
        "full": "The latest backup that completed successfully was {moreThanThreeDaysAgo}.",
        "moreThanThreeDaysAgo": "more than three days ago"
      },
      {
        "full": "The most likely fixes are to {terminate} the connection and set it up again, or to restart the service.",
        "terminate": "terminate"
      }
    ],
    "success": [
      // This text is displayed if the latest backup attempt was successful. It indicates that the backup process is working.
      "Backup is working.",
      // {dateTime} shows the date and time at which the last backup completed,
      // for example: "2020/01/01 01:23". It may show a formatted date like
      // "2020/01/01", or it may use a word like "today", "yesterday", or
      // "Sunday". {dateTime} is formatted in bold.
      "The last backup completed successfully {dateTime}."
    ],
    "action": {
      "setUp": "Set up now",
      "terminate": "Terminate"
    }
  }
}
</i18n>
