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
    <!-- Do not show the navbar until the first time a navigation is confirmed.
    The user's session may change during that time, affecting how the navbar is
    rendered. -->
    <navbar v-show="anyNavigationConfirmed"/>
    <alert id="app-alert"/>
    <div class="container-fluid">
      <router-view/>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import Alert from './alert.vue';
import Navbar from './navbar.vue';

export default {
  name: 'App',
  components: { Alert, Navbar },
  // Vue seems to trigger the initial navigation before creating App. If the
  // initial navigation is synchronous, Vue seems to confirm the navigation
  // before creating App. However, if the initial navigation is asynchronous,
  // Vue seems to create App before confirming the navigation.
  computed: mapState({
    anyNavigationConfirmed: (state) => state.router.anyNavigationConfirmed
  })
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
