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
  <div id="account-claim" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">
            Set Password
          </h1>
        </div>
        <div class="panel-body">
          <alert v-bind="alert" @close="alert.state = false"/>
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
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'AccountClaim',
  mixins: [alert(), request()],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      password: ''
    };
  },
  computed: {
    token() {
      const { token } = this.$route.query;
      // Vue interprets + characters in tokens as spaces, so we have to change
      // them back.
      return token != null ? token.replace(/ /g, '+') : '';
    }
  },
  methods: {
    submit() {
      const headers = { Authorization: `Bearer ${this.token}` };
      this
        .post('/users/reset/verify', { new: this.password }, { headers })
        .then(() => {
          this.$alert = alert.success('The password was reset successfully.');
          this.$router.push('/login');
        })
        .catch(() => {});
    }
  }
};
</script>
