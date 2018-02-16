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
    <page-head>
      <template slot="title">Users</template>
      <template slot="body">
        Staff Users are granted access to this administration site, while Field
        Keys give clients (like
        <doc-link to="collect-intro/">Collect</doc-link>)
        individual access to the forms to download, fill out, and submit.
        <doc-link>Learn more</doc-link>
      </template>
      <template slot="tabs">
        <li role="presentation" class="active">
          <a href="#user-list-staff" aria-controls="user-list-staff"
            role="tab" data-toggle="tab">
            Staff
          </a>
        </li>
        <li role="presentation">
          <a href="#user-list-field-keys" aria-controls="user-list-field-keys"
            role="tab" data-toggle="tab">
            Field Keys
          </a>
        </li>
      </template>
    </page-head>
    <page-body>
      <div class="tab-content">
        <div id="user-list-staff" class="tab-pane active" role="tabpanel">
          <alert v-bind="alert" @close="alert.state = false"/>
          <float-row>
            <button type="button" id="user-list-new-button"
              class="btn btn-primary" @click="newUser.state = true">
            <span class="icon-plus-circle"></span> Create Staff User
            </button>
          </float-row>
          <loading :state="awaitingResponse"/>
          <table v-if="users" id="user-list-table" class="table table-hover">
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
                <!-- TODO: Once this is added to the API, pull it from
                `user`. -->
                <td>Yes</td>
                <td>
                  <div class="dropdown">
                    <button type="button" :id="actionsId(index)"
                      class="btn btn-primary dropdown-toggle"
                      data-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="true">
                      <span class="icon-cog"></span>
                      <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right"
                      :aria-labelledby="actionsId(index)">
                      <li>
                        <a href="#" @click.prevent="showResetPassword(user)">
                          Reset Password
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="user-list-field-keys" class="tab-pane" role="tabpanel">
          Not yet implemented.
        </div>
      </div>

      <!-- Modals -->
      <user-new v-bind="newUser" @hide="newUser.state = false"
        @success="afterCreate"/>
      <user-reset-password v-bind="resetPassword"
        @hide="resetPassword.state = false" @success="afterResetPassword"/>
    </page-body>
  </div>
</template>

<script>
import UserNew from './new.vue';
import UserResetPassword from './reset-password.vue';
import alert from '../../mixins/alert';
import highlight from '../../mixins/highlight';
import request from '../../mixins/request';

export default {
  name: 'UserList',
  components: { UserNew, UserResetPassword },
  mixins: [alert({ global: true }), request(), highlight()],
  data() {
    return {
      alert: alert.blank(),
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
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.users = null;
      this
        .get('/users')
        .then(users => {
          this.users = users;
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
      this.fetchData();
      this.alert = alert.success(`A user was created successfully for ${user.email}.`);
      this.highlighted = user.id;
    },
    afterResetPassword() {
      this.alert = alert.success(`An email has been sent to ${this.resetPassword.user.email} with instructions on how to proceed.`);
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
