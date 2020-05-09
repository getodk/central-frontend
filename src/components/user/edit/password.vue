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
      <h1 class="panel-title">{{ $t('title') }}</h1>
    </div>
    <div class="panel-body">
      <form v-if="user != null && user.id === currentUser.id"
        @submit.prevent="submit">
        <input :value="currentUser.email" autocomplete="username">
        <form-group id="user-edit-password-old-password" v-model="oldPassword"
          type="password" :placeholder="$t('field.oldPassword')" required
          autocomplete="current-password"/>
        <form-group id="user-edit-password-new-password" v-model="newPassword"
          type="password" :placeholder="$t('field.newPassword')" required
          :has-error="mismatch" autocomplete="new-password"/>
        <form-group id="user-edit-password-confirm" v-model="confirm"
          type="password" :placeholder="$t('field.passwordConfirm')" required
          :has-error="mismatch" autocomplete="new-password"/>
        <button :disabled="awaitingResponse" type="submit"
          class="btn btn-primary">
          {{ $t('action.change') }} <spinner :state="awaitingResponse"/>
        </button>
      </form>
      <template v-else>
        {{ $t('cannotChange') }}
      </template>
    </div>
  </div>
</template>

<script>
import FormGroup from '../../form-group.vue';
import Spinner from '../../spinner.vue';
import request from '../../../mixins/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'UserEditPassword',
  components: { FormGroup, Spinner },
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
        this.$alert().danger(this.$t('alert.mismatch'));
        return;
      }
      const data = { old: this.oldPassword, new: this.newPassword };
      this.put(apiPaths.password(this.user.id), data)
        .then(() => {
          this.$alert().success(this.$t('alert.success'));

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
