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
    <loading v-if="backups == null" :state="awaitingResponse"/>
    <div v-else class="panel panel-simple">
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
import { DateTime } from 'luxon';

import BackupNew from './new.vue';
import BackupTerminate from './terminate.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import { formatDate } from '../../util/util';

// The duration for which a backup attempt is considered "recent": if the server
// returns no log of a recent backup attempt, that means that there have been no
// backup attempts for that duration into the past. If the server returns no log
// of a recent backup attempt, and if backups were configured more than that
// duration into the past (that is, if the latest config is itself not recent),
// then the user is informed that something has gone wrong.
const RECENT_DURATION = { days: 3 };

class Backups {
  constructor(data = {}) {
    this._setAt = data.setAt;
    this._recent = data.recent != null
      ? this.constructor.recentForConfig(data)
      : null;
  }

  // recentForConfig() returns the recent backup attempts for the current
  // config.
  static recentForConfig({ setAt, recent }) {
    const result = [];
    for (const attempt of recent) {
      if (attempt.loggedAt < setAt) {
        // Any attempts that follow are for a previous config.
        break;
      }

      /* This will evaluate to `false` only if an attempt for a previous config
      was logged after the current config was created, which seems unlikely. A
      failed attempt might not have a configSetAt property, which means that if
      a failed attempt was logged after the current config was created, we might
      not be able to determine whether the attempt corresponds to the current
      config or (again unlikely) to a previous one. We assume that an attempt
      without a configSetAt property corresponds to the current config. */
      if (attempt.details.configSetAt === setAt ||
        attempt.details.configSetAt == null)
        result.push(attempt);
    }
    return result;
  }

  static notConfigured() { return new Backups(); }

  static fromResponse(response) {
    return response.status !== 404
      ? new Backups(response.data)
      : Backups.notConfigured();
  }

  get setAt() { return this._setAt; }
  get recent() { return this._recent; }

  get status() {
    if (this._setAt == null) return 'notConfigured';
    if (this._recent.length === 0) {
      return DateTime.fromISO(this._setAt) < DateTime.local().minus(RECENT_DURATION)
        ? 'somethingWentWrong'
        : 'neverRun';
    }
    return this._recent[0].details.success ? 'success' : 'somethingWentWrong';
  }
}

const validateBackupsResponseStatus = (status) =>
  (status >= 200 && status < 300) || status === 404;

export default {
  name: 'BackupList',
  components: { BackupNew, BackupTerminate },
  mixins: [modal(['newBackup', 'terminate']), request()],
  data() {
    return {
      requestId: null,
      backups: null,
      newBackup: {
        state: false
      },
      terminate: {
        state: false
      }
    };
  },
  computed: {
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
      this.backups = null;
      this
        .get('/config/backups', { validateStatus: validateBackupsResponseStatus })
        .then(response => {
          this.backups = Backups.fromResponse(response);
        })
        .catch(() => {});
    },
    afterCreate() {
      this.$alert().success('Success! Automatic backups are now configured.');
      this.fetchData();
    },
    afterTerminate() {
      this.$alert().success('Your automatic backups were terminated. I recommend you set up a new one as soon as possible.');
      this.backups = Backups.notConfigured();
    },
    // The following methods are used in tests. (It does not seem otherwise
    // possible to export them from this single file component.)
    recentDate() {
      return DateTime.local().minus(RECENT_DURATION).toJSDate();
    },
    recentForConfig(data) {
      return Backups.recentForConfig(data);
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
    max-width: 585px;

    &:first-child {
      font-size: $title-font-size;
    }
  }
}
</style>
