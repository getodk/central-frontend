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
  <div id="account-claim" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">
            Set Password
          </h1>
        </div>
        <div class="panel-body">
          <app-form @submit="submit">
            <label class="form-group">
              <input v-model="password" type="password" class="form-control"
                placeholder="New Password *" required>
              <span class="form-label">New Password *</span>
            </label>
            <div class="panel-footer">
              <button :disabled="awaitingResponse" type="submit"
                class="btn btn-primary">
                Set password <spinner :state="awaitingResponse"/>
              </button>
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
  name: 'AccountClaim',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      password: ''
    };
  },
  methods: {
    problemToAlert(problem) {
      return problem.code === 401.2
        ? `${problem.message} The password reset link may have expired, and the password may need to be reset again.`
        : null;
    },
    submit() {
      const headers = {};
      const { token } = this.$route.query;
      if (token != null) headers.Authorization = `Bearer ${token}`;
      this
        .post('/users/reset/verify', { new: this.password }, { headers })
        .then(() => this.$router.push('/login', () => {
          this.$alert().success('The password was reset successfully.');
        }))
        .catch(() => {});
    }
  }
};
</script>
