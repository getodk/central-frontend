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
    <page-head v-show="user != null">
      <template v-if="user != null" #title>{{ user.displayName }}</template>
    </page-head>
    <page-body>
      <loading :state="$store.getters.initiallyLoading(['user'])"/>
      <div v-show="user != null" class="row">
        <div class="col-xs-7">
          <user-edit-basic-details v-if="user != null"/>
        </div>
        <div class="col-xs-5">
          <user-edit-password/>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import UserEditBasicDetails from './edit/basic-details.vue';
import UserEditPassword from './edit/password.vue';
import reconcileData from '../../store/modules/request/reconcile';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

reconcileData.add(
  'user', 'currentUser',
  (user, currentUser, commit) => {
    if (user.id === currentUser.id) {
      commit('setData', {
        key: 'currentUser',
        value: currentUser.with(user.object)
      });
    }
  }
);

export default {
  name: 'UserEdit',
  components: {
    Loading,
    PageBody,
    PageHead,
    UserEditBasicDetails,
    UserEditPassword
  },
  mixins: [validateData({ update: true })],
  props: {
    id: {
      type: String,
      required: true
    }
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['user']),
  watch: {
    /*
    There are three cases to consider:

      1. The user navigates to /account/edit.
      2. The user navigates to /users/:id/edit for their own user.
      3. The user navigates to /users/:id/edit for a different user.

    When navigating between (1) and (2), this.id will not change, but
    this.$route will. The validateData beforeRouteEnter navigation guard will
    also be called.

    When navigating between (1) and (3), this.id will change, as will
    this.$route. The validateData beforeRouteEnter navigation guard will be
    called.

    When navigating between (2) and (3), this.id will change, as will
    this.$route. The validateData beforeRouteUpdate navigation guard will be
    called.
    */
    $route: 'fetchData'
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [
        { key: 'user', url: apiPaths.user(this.id) }
      ]).catch(noop);
    }
  }
};
</script>
