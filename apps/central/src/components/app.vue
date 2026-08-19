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
  <div>
    <!-- If the user's session is restored during the initial navigation, that
    will affect how the navbar is rendered. -->
    <navbar v-show="routerReady"/>
    <outdated-version/>
    <alerts/>
    <feedback-button v-if="showsFeedbackButton"/>
    <div ref="containerEl" class="container-fluid">
      <router-view/>
    </div>

    <div id="modals"></div>
    <div id="tooltips"></div>
    <hover-cards/>
  </div>
</template>

<script>
import { defineAsyncComponent, inject, useTemplateRef } from 'vue';

import { START_LOCATION } from 'vue-router';

import Alerts from './alerts.vue';
import Navbar from './navbar.vue';

import useCallWait from '../composables/call-wait';
import useDisabled from '../composables/disabled';
import { loadAsync } from '../util/load-async';
import { useAlert } from '../alert';
import { useRequestData } from '../request-data';
import { useSessions } from '../util/session';

export default {
  name: 'App',
  components: {
    Alerts,
    HoverCards: defineAsyncComponent(loadAsync('HoverCards')),
    Navbar,
    FeedbackButton: defineAsyncComponent(loadAsync('FeedbackButton')),
    OutdatedVersion: defineAsyncComponent(loadAsync('OutdatedVersion'))
  },
  inject: ['alert', 'config', 'location'],
  setup() {
    const { toast } = inject('container');

    const { visiblyLoggedIn } = useSessions();
    useDisabled();

    const containerEl = useTemplateRef('containerEl');
    useAlert(toast, containerEl);

    const { centralVersion } = useRequestData();
    const { callWait } = useCallWait();
    return { visiblyLoggedIn, centralVersion, callWait };
  },
  computed: {
    routerReady() {
      return this.$route !== START_LOCATION;
    },
    showsFeedbackButton() {
      return this.config.loaded && this.config.showsFeedbackButton &&
        this.visiblyLoggedIn;
    },
  },
  created() {
    this.callWait('checkVersion', this.checkVersion, (tries) =>
      (tries === 0 ? 15000 : 60000));
  },
  methods: {
    checkVersion() {
      const previousVersion = this.centralVersion.versionText;
      return this.centralVersion.request({
        url: '/version.txt',
        clear: false,
        alert: false
      })
        .then(() => {
          if (previousVersion == null || this.centralVersion.versionText === previousVersion)
            return false;

          // Alert the user about the version change, then keep alerting them.
          // One benefit of this approach is that the user should see the toast
          // even if there is another toast (say, about session expiration).
          this.callWait(
            'versionChange',
            () => {
              this.alert.info(this.$t('alert.versionChange'))
                .cta(this.$t('action.refreshPage'), () => { this.location.reload(); });
            },
            (count) => (count === 0 ? 0 : 60000)
          );
          return true;
        })
        // This error could be the result of logout, which will cancel all
        // requests.
        .catch(error =>
          (error.response != null && error.response.status === 404));
    }
  }
};
</script>
