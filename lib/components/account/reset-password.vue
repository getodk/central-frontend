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
  <div id="account-reset-password" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">
            Reset Password
          </h1>
        </div>
        <div class="panel-body">
          <app-form @submit="submit">
            <label class="form-group">
              <input v-model.trim="email" type="email" class="form-control"
                placeholder="Email address *" required autocomplete="off">
              <span class="form-label">Email address *</span>
            </label>
            <div class="panel-footer">
              <button :disabled="awaitingResponse" type="submit"
                class="btn btn-primary">
                Reset password <spinner :state="awaitingResponse"/>
              </button>
              <router-link :to="loginLocation" tag="button" type="button"
                class="btn btn-link">
                Cancel
              </router-link>
            </div>
          </app-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'AccountResetPassword',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      email: ''
    };
  },
  computed: {
    loginLocation() {
      return {
        path: '/login',
        query: Object.assign({}, this.$route.query)
      };
    }
  },
  methods: {
    submit() {
      this
        .post('/users/reset/initiate', { email: this.email })
        .then(() => this.$router.push(this.loginLocation, () => {
          this.$alert().success(`An email has been sent to ${this.email} with further instructions.`);
        }))
        .catch(() => {});
    }
  }
};
</script>
