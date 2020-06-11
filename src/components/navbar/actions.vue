<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <li v-if="$store.getters.loggedOut" id="navbar-actions">
    <a href="#" @click.prevent>
      <span class="icon-user-circle-o"></span>{{ $t('notLoggedIn') }}
    </a>
  </li>
  <li v-else id="navbar-actions" class="dropdown">
    <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button"
      aria-haspopup="true" aria-expanded="false">
      <span class="icon-user-circle-o"></span>
      <span>{{ currentUser.displayName }}</span>
      <span class="caret"></span>
    </a>
    <ul class="dropdown-menu">
      <li>
        <router-link id="navbar-actions-edit-profile" to="/account/edit">
          {{ $t('action.editProfile') }}
        </router-link>
      </li>
      <li>
        <a id="navbar-actions-log-out" href="#" @click.prevent="logOut">
          {{ $t('action.logOut') }}
        </a>
      </li>
    </ul>
  </li>
</template>

<script>
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'NavbarActions',
  mixins: [request()],
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['currentUser', 'session']),
  methods: {
    logOut() {
      this.request({
        method: 'DELETE',
        url: apiPaths.session(this.session.token)
      }).catch(noop);
      this.$store.commit('clearData');
      this.$router.push('/login', () => {
        this.$alert().success(this.$t('alert.logOut'));
      });
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "notLoggedIn": "Not logged in",
    "action": {
      "logOut": "Log out"
    },
    "alert": {
      "logOut": "You have logged out successfully."
    }
  }
}
</i18n>
