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
          <h1 class="panel-title">{{ $t('title') }}</h1>
        </div>
        <div class="panel-body">
          <form @submit.prevent="submit">
            <!-- Chrome displays a message in the console indicating that there
            should be a username input (even if it is hidden). However, we do
            not know the user's email address on this page. -->
            <form-group ref="password" v-model="password" type="password"
              :placeholder="$t('field.newPassword')" required
              autocomplete="new-password"/>
            <div class="panel-footer">
              <button :disabled="awaitingResponse" type="submit"
                class="btn btn-primary">
                {{ $t('action.set') }} <spinner :state="awaitingResponse"/>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

export default {
  name: 'AccountClaim',
  components: { FormGroup, Spinner },
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
      const headers = {};
      const { token } = this.$route.query;
      if (token != null) headers.Authorization = `Bearer ${token}`;
      this.request({
        method: 'POST',
        url: '/users/reset/verify',
        headers,
        data: { new: this.password }
      })
        .then(() => {
          this.$router.push('/login', () => {
            this.$alert().success(this.$t('alert.success'));
          });
        })
        .catch(noop);
    }
  }
};
</script>
