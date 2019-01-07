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
    <float-row class="table-actions">
      <refresh-button slot="left" :fetching="awaitingResponse"
        @refresh="fetchData({ clear: false })"/>
      <button id="user-list-new-button" slot="right" type="button"
        class="btn btn-primary" @click="newUser.state = true">
        <span class="icon-plus-circle"></span>Create web user
      </button>
    </float-row>
    <loading v-if="users == null" :state="awaitingResponse"/>
    <table v-else id="user-list-table" class="table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Is Administrator?</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <user-row v-for="user of users" :key="user.id" :user="user"
          :highlighted="highlighted" @reset-password="showResetPassword"/>
      </tbody>
    </table>

    <!-- Modals -->
    <user-new v-bind="newUser" @hide="newUser.state = false"
      @success="afterCreate"/>
    <user-reset-password v-bind="resetPassword"
      @hide="resetPassword.state = false" @success="afterResetPassword"/>
  </div>
</template>

<script>
import UserNew from './new.vue';
import UserResetPassword from './reset-password.vue';
import UserRow from './row.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'UserList',
  components: { UserNew, UserResetPassword, UserRow },
  mixins: [
    request(),
    modal(['newUser', 'resetPassword'])
  ],
  data() {
    return {
      requestId: null,
      users: null,
      highlighted: null,
      newUser: {
        state: false
      },
      resetPassword: {
        state: false,
        user: {
          email: ''
        }
      }
    };
  },
  created() {
    this.fetchData({ clear: false });
  },
  methods: {
    fetchData({ clear }) {
      if (clear) this.users = null;
      this
        .get('/users')
        .then(({ data }) => {
          this.users = data;
          if (!clear) this.highlighted = null;
        })
        .catch(() => {});
    },
    showResetPassword(user) {
      this.resetPassword.user = user;
      this.resetPassword.state = true;
    },
    afterCreate(user) {
      this.fetchData({ clear: true });
      this.$alert().success(`A user was created successfully for ${user.email}.`);
      this.highlighted = user.id;
    },
    afterResetPassword() {
      const { email } = this.resetPassword.user;
      this.$alert().success(`The password for ${email} has been invalidated. An email has been sent to ${email} with instructions on how to proceed.`);
    }
  }
};
</script>

<style lang="sass">
#user-list-table {
  & > thead > tr > th:nth-child(2),
  & > tbody > tr > td:nth-child(2) {
    width: 235px;
  }

  & > thead > tr > th:nth-child(3),
  & > tbody > tr > td:nth-child(3) {
    width: 90px;
  }

  > tbody > tr > td {
    vertical-align: middle;
  }
}
</style>
