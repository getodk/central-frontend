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
  <div id="user-edit-password" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">Change Password</h1>
    </div>
    <div class="panel-body">
      <form v-if="user != null && user.id === currentUser.id"
        @submit.prevent="submit">
        <input :value="currentUser.email" autocomplete="username">
        <label class="form-group">
          <input id="user-edit-password-old-password" v-model="oldPassword"
            type="password" class="form-control" placeholder="Old password *"
            required autocomplete="current-password">
          <span class="form-label">Old password *</span>
        </label>
        <label :class="{ 'has-error': mismatch }" class="form-group">
          <input id="user-edit-password-new-password" v-model="newPassword"
            type="password" class="form-control" placeholder="New password *"
            required autocomplete="new-password">
          <span class="form-label">New password *</span>
        </label>
        <label :class="{ 'has-error': mismatch }" class="form-group">
          <input id="user-edit-password-confirm" v-model="confirm"
            type="password" class="form-control"
            placeholder="New password (confirm) *" required
            autocomplete="new-password">
          <span class="form-label">New password (confirm) *</span>
        </label>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          Change password <spinner :state="awaitingResponse"/>
        </button>
      </form>
      <template v-else>
        Only the owner of the account may directly set their own password.
      </template>
    </div>
  </div>
</template>

<script>
import Spinner from '../../spinner.vue';
import request from '../../../mixins/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'UserEditPassword',
  components: { Spinner },
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
  computed: requestData(['currentUser', 'user']),
  watch: {
    $route() {
      this.oldPassword = '';
      this.newPassword = '';
      this.confirm = '';
      this.mismatch = false;
    }
  },
  methods: {
    submit() {
      this.mismatch = this.newPassword !== this.confirm;
      if (this.mismatch) {
        this.$alert().danger('Please check that your new passwords match.');
        return;
      }
      const data = { old: this.oldPassword, new: this.newPassword };
      this.put(apiPaths.password(this.user.id), data)
        .then(() => {
          this.$alert().success('Success! Your password has been updated.');

          // The Chrome password manager does not realize that the form was
          // submitted. Should we navigate to a different page so that it does?
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
#user-edit-password input[autocomplete="username"] {
  display: none;
}
</style>
