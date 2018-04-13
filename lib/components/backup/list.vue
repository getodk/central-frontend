<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <alert v-bind="alert" @close="alert.state = false"/>
    <loading v-if="backups == null" :state="awaitingResponse"/>
    <table v-else id="backup-list-status-table" class="table">
      <thead>
        <tr>
          <th colspan="3">Current Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><p><span :class="iconClasses"></span></p></td>
          <td>
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
                If you have configured backups within the last three days, this
                is normal. Otherwise, something has gone wrong.
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
                <strong>{{ $formatDate(backups.latest.loggedAt) }}</strong>.
              </p>
            </template>
          </td>
          <td>
            <p>
              <button type="button" v-if="backups.status == 'notConfigured'"
                class="btn btn-primary">
                <span class="icon-plus-circle"></span> Set up Now
              </button>
              <button type="button" v-else class="btn btn-primary">
                <span class="icon-times-circle"></span> Reconfigure
              </button>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import moment from 'moment';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

class Backups {
  constructor({ config, latest }) {
    this._config = config;
    this._latest = latest;
  }

  static notConfigured() { return new Backups({}); }

  get config() { return this._config; }
  get latest() { return this._latest; }

  get status() {
    if (this._config == null) return 'notConfigured';
    if (this._latest == null) return 'neverRun';
    const loggedAt = moment(this._latest.loggedAt).valueOf();
    const threeDaysAgo = Date.now() - (3 * MILLISECONDS_IN_A_DAY);
    if (!this._latest.details.success || loggedAt < threeDaysAgo)
      return 'somethingWentWrong';
    return 'success';
  }
}

const statusIs2xxOr404 = (status) =>
  (status >= 200 && status < 300) || status === 404;

export default {
  name: 'BackupList',
  mixins: [alert(), request()],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      backups: null
    };
  },
  computed: {
    iconClasses() {
      switch (this.backups.status) {
        case 'notConfigured':
        case 'neverRun':
          return ['icon-question-circle', 'text-muted'];
        case 'somethingWentWrong':
          return ['icon-times-circle', 'text-danger'];
        default:
          return ['icon-check-circle', 'text-success'];
      }
    }
  },
  watch: {
    alert() {
      this.$emit('alert');
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.backups = null;
      this
        .get('/config/backups', { validateStatus: statusIs2xxOr404 })
        .then(response => {
          this.backups = response.status !== 404
            ? new Backups(response.data)
            : Backups.notConfigured();
        })
        .catch(() => {});
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#backup-list-status-table {
  td {
    padding-top: 10px;

    &:nth-child(1) {
      padding-right: 5px;
      width: 41px;

      p {
        font-size: 32px;

        [class^="icon-"] {
          vertical-align: 1px;
        }
      }
    }

    &:nth-child(2), &:nth-child(3) {
      p:first-child {
        font-size: 28px;
      }
    }

    &:nth-child(2) {
      p {
        max-width: 585px;
      }
    }

    &:nth-child(3) {
      width: 113px;
    }
  }
}
</style>
