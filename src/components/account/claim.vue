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
  <div id="account-claim" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">
            Set Password
          </h1>
        </div>
        <div class="panel-body">
          <form @submit.prevent="submit">
            <!-- Chrome displays a message in the console indicating that there
            should be a username input (even if it is hidden). However, we do
            not know the user's email address on this page. -->
            <label class="form-group">
              <input ref="password" v-model="password" type="password"
                class="form-control" placeholder="New Password *" required
                autocomplete="new-password">
              <span class="form-label">New Password *</span>
              <password v-model="password" :strength-meter-only="true"
               strength-meter-class="password-strength"/>
            </label>
            <div class="panel-footer">
              <button :disabled="awaitingResponse" type="submit"
                class="btn btn-primary">
                Set password <spinner :state="awaitingResponse"/>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

const Password = () => import('vue-password-strength-meter');

export default {
  name: 'AccountClaim',
  components: { Spinner, Password },
  mixins: [request()],
  data() {
    return {
      awaitingResponse: false,
      password: ''
    };
  },
  mounted() {
    this.$refs.password.focus();
  },
  methods: {
    submit() {
      if (this.password.length < 10) {
        this.$alert().danger('Please enter minimum 10 characters password');
        return;
      }
      const headers = {};
      const { token } = this.$route.query;
      if (token != null) headers.Authorization = `Bearer ${token}`;
      this.request({
        method: 'POST',
        url: '/users/reset/verify',
        headers,
        data: { new: this.password },
        problemToAlert: ({ code, message }) => (code === 401.2
          ? `${message} The link in your email may have expired, and a new email may have to be sent.`
          : null)
      })
        .then(() => {
          this.$router.push('/login', () => {
            this.$alert().success('The password was reset successfully.');
          });
        })
        .catch(noop);
    }
  }
};
</script>
