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
  <div id="account-reset-password" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">
            Reset Password
          </h1>
        </div>
        <div class="panel-body">
          <alert v-bind="alert" @close="alert.state = false"/>
          <app-form @submit="submit">
            <label class="form-group">
              <input type="email" v-model.trim="email" class="form-control"
                placeholder="Email address *" required autocomplete="off">
              <span class="form-label">Email address *</span>
            </label>
            <div class="panel-footer">
              <button type="submit" class="btn btn-primary" :disabled="awaitingResponse">
                Reset Password <spinner :state="awaitingResponse"/>
              </button>
              <button type="button" class="btn btn-link" @click="routeToLogin">
                Cancel
              </button>
            </div>
          </app-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'AccountLogin',
  mixins: [alert({ global: true }), request()],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      email: ''
    };
  },
  methods: {
    routeToLogin() {
      this.$router.push({
        path: '/login',
        query: Object.assign({}, this.$route.query)
      });
    },
    submit() {
      this
        .post('/users/reset/initiate', { email: this.email })
        .then(() => {
          this.$alert = alert.success(`An email has been sent to ${this.email} with further instructions.`);
          this.routeToLogin();
        })
        .catch(() => {});
    }
  }
};
</script>
