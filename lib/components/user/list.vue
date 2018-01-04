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
          <a href="#staff" aria-controls="staff" role="tab" data-toggle="tab">
            Staff
          </a>
        </li>
        <li role="presentation">
          <a href="#field-keys" aria-controls="field-keys" role="tab" data-toggle="tab">
            Field Keys
          </a>
        </li>
      </template>
    </page-head>
    <page-body>
      <div class="tab-content">
        <div id="staff" class="tab-pane active" role="tabpanel">
          <alerts :list="alerts" @dismiss="dismissAlert"/>
          <float-row>
            <button type="button" class="btn btn-primary"
              @click="newUser.state = true">
            Create Staff User
            </button>
          </float-row>
          <loading :state="awaitingResponse"/>
          <table v-if="users" class="table table-hover">
            <thead>
              <tr>
                <th>Email</th>
                <th>Is Administrator?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user of users" :key="user.id"
                :class="highlight(user, 'id')">
                <td>{{ user.email }}</td>
                <!-- TODO: Once this is added to the API, pull it from
                `user`. -->
                <td>Yes</td>
                <td>
                  <a href="#" @click.prevent="resetPassword.show(user)">
                    Reset Password
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="field-keys" class="tab-pane" role="tabpanel">
          Not yet implemented.
        </div>
      </div>

      <!-- Modals -->
      <user-new v-bind="newUser" @hide="newUser.state = false"
        @create="afterCreate"/>
      <user-reset-password v-bind="resetPassword"
        @hide="resetPassword.state = false"/>
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
  mixins: [alert, request, highlight],
  data() {
    return {
      alerts: [],
      awaitingResponse: false,
      users: null,
      highlighted: null,
      newUser: {
        state: false
      },
      resetPassword: {
        state: false,
        user: {
          email: ''
        },
        show(user) {
          this.user = user;
          this.state = true;
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
        .then(response => {
          this.users = response.data;
        })
        .catch(error => console.error(error));
    },
    afterCreate(user) {
      this.fetchData();
      this.alert('success', `User created successfully for ${user.email}.`);
      this.highlighted = user.id;
    }
  },
  components: { UserNew, UserResetPassword }
};
</script>

<style>
table > thead > tr > th:nth-child(2),
table > tbody > tr > td:nth-child(2) {
  width: 175px;
}

table > thead > tr > th:nth-child(3),
table > tbody > tr > td:nth-child(3) {
  width: 150px;
}
</style>
