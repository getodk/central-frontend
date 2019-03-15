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
  <div id="account-edit-password" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">Change Password</h1>
    </div>
    <div class="panel-body">
      <form @submit.prevent="submit">
        <label class="form-group">
          <input id="form-edit-password-old-password" v-model="oldPassword"
            type="password" class="form-control" placeholder="Old password *"
            required>
          <span class="form-label">Old password *</span>
        </label>
        <label :class="{ 'has-error': mismatch }" class="form-group">
          <input id="form-edit-password-new-password" v-model="newPassword"
            type="password" class="form-control" placeholder="New password *"
            required>
          <span class="form-label">New password *</span>
        </label>
        <label :class="{ 'has-error': mismatch }" class="form-group">
          <input id="form-edit-password-confirm" v-model="confirm"
            type="password" class="form-control"
            placeholder="New password (confirm) *" required>
          <span class="form-label">New password (confirm) *</span>
        </label>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          Change password <spinner :state="awaitingResponse"/>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import request from '../../../mixins/request';

export default {
  name: 'FormEditPassword',
  mixins: [request()],
  data() {
    return {
      awaitingResponse: false,
      oldPassword: '',
      newPassword: '',
      confirm: '',
      mismatch: false
    };
  },
  methods: {
    submit() {
      this.mismatch = this.newPassword !== this.confirm;
      if (this.mismatch) {
        this.$alert().danger('Please check that your new passwords match.');
        return;
      }
      const data = { old: this.oldPassword, new: this.newPassword };
      this.put(`/users/${this.$session.user.id}/password`, data)
        .then(() => {
          this.$alert().success('Success! Your password has been updated.');
        })
        .catch(() => {});
    }
  }
};
</script>
