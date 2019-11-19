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
  <div>
    <page-head v-show="user != null">
      <template v-if="user != null" #title>
        {{ user.displayName }}
      </template>
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
import UserEditBasicDetails from './edit/basic-details.vue';
import UserEditPassword from './edit/password.vue';
import validateData from '../../mixins/validate-data';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'UserEdit',
  components: { UserEditBasicDetails, UserEditPassword },
  mixins: [validateData()],
  props: {
    id: {
      type: String,
      required: true
    }
  },
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
      this.$store.dispatch('get', [{
        key: 'user',
        url: `/users/${this.id}`,
        success: ({ currentUser }) => {
          if (this.user.id !== currentUser.id) return;
          this.$store.commit('setData', {
            key: 'currentUser',
            value: currentUser.with(this.user.object)
          });
        }
      }]).catch(noop);
    }
  }
};
</script>
