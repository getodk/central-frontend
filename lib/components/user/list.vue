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
        <span class="icon-plus-circle"></span> Create web user
      </button>
    </float-row>
    <loading v-if="users == null" :state="awaitingResponse"/>
    <table v-else id="user-list-table" class="table table-hover">
      <thead>
        <tr>
          <th>Email</th>
          <th>Is Administrator?</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in users" :key="user.id"
          :class="highlight(user, 'id')">
          <td>{{ user.email }}</td>
          <!-- TODO: Once this is added to the API, pull it from `user`. -->
          <td>Yes</td>
          <td>
            <div class="dropdown">
              <button :id="actionsId(index)" type="button"
                class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
                <span class="icon-cog"></span>
                <span class="caret"></span>
              </button>
              <ul :aria-labelledby="actionsId(index)"
                class="dropdown-menu dropdown-menu-right">
                <li>
                  <a href="#" @click.prevent="showResetPassword(user)">
                    Reset password
                  </a>
                </li>
              </ul>
            </div>
          </td>
        </tr>
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
import highlight from '../../mixins/highlight';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'UserList',
  components: { UserNew, UserResetPassword },
  mixins: [
    request(),
    modal(['newUser', 'resetPassword']),
    highlight()
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
    actionsId(index) {
      return `user-list-actions${index}`;
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
      this.$alert().success(`An email has been sent to ${this.resetPassword.user.email} with instructions on how to proceed.`);
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

  & > tbody > tr > td {
    vertical-align: middle;

    .dropdown-menu {
      margin-right: 23px;
    }
  }
}
</style>
