<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div ref="app">
    <!-- If the user's session is restored during the initial navigation, that
    will affect how the navbar is rendered. -->
    <navbar v-show="routerReady"/>
    <alert id="app-alert"/>
    <!-- Specifying .capture so that an alert is not hidden immediately if it
    was shown after the click. -->
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="container-fluid" @click.capture="hideAlertAfterClick">
      <router-view/>
    </div>
  </div>
</template>

<script>
import { START_LOCATION } from 'vue-router';

import Alert from './alert.vue';
import Navbar from './navbar.vue';

import useCallWait from '../composables/call-wait';
import { useRequestData } from '../request-data';
import { useSessions } from '../util/session';

export default {
  name: 'App',
  components: { Alert, Navbar },
  inject: ['alert'],
  setup() {
    useSessions();

    const { centralVersion } = useRequestData();
    const { callWait } = useCallWait();
    return { centralVersion, callWait };
  },
  computed: {
    routerReady() {
      return this.$route !== START_LOCATION;
    }
  },
  created() {
    this.callWait('checkVersion', this.checkVersion, (tries) =>
      (tries === 0 ? 15000 : 60000));
  },
  methods: {
    checkVersion() {
      const previousVersion = this.centralVersion.data;
      return this.centralVersion.request({
        url: '/version.txt',
        clear: false,
        alert: false
      })
        .then(() => {
          if (previousVersion == null || this.centralVersion.data === previousVersion)
            return false;

          // Alert the user about the version change, then keep alerting them.
          // One benefit of this approach is that the user should see the alert
          // even if there is another alert (say, about session expiration).
          this.callWait(
            'alertVersionChange',
            () => { this.alert.info(this.$t('alert.versionChange')); },
            (count) => (count === 0 ? 0 : 60000)
          );
          return true;
        })
        // This error could be the result of logout, which will cancel all
        // requests.
        .catch(error =>
          (error.response != null && error.response.status === 404));
    },
    hideAlertAfterClick(event) {
      if (this.alert.state && event.target.closest('a[target="_blank"]') != null &&
        !event.defaultPrevented) {
        this.alert.blank();
      }
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

#app-alert {
  border-bottom: 1px solid transparent;
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  left: 50%;
  margin-left: -250px;
  position: fixed;
  text-align: center;
  top: 34px;
  width: 500px;
  // 1 greater than the Bootstrap maximum
  z-index: 1061;

  &.alert-success {
    border-color: $color-success;
  }

  &.alert-info {
    border-color: $color-info;
  }

  &.alert-danger {
    border-color: $color-danger;
  }
}

body.modal-open #app-alert {
  display: none;
}
</style>
