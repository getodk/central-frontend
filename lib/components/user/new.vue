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
  <modal :state="state" @hide="$emit('hide')" @shown="focusField" backdrop>
    <template slot="title">Create Staff User</template>
    <template slot="body">
      <alerts :list="alerts" @dismiss="dismissAlert"/>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="user-new-email">Email address *</label>
          <input type="email" v-model.trim="email" id="user-new-email"
            class="form-control" placeholder="Email" required
            :disabled="awaitingResponse" @keyup.enter="submit">
        </div>
      </form>
    </template>
    <template slot="footer">
      <button type="button" class="btn btn-primary" :disabled="awaitingResponse"
        @click="submit">
        Create <spinner :state="awaitingResponse"/>
      </button>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'UserNew',
  mixins: [alert, request],
  props: {
    state: Boolean
  },
  data() {
    return {
      alerts: [],
      requestId: null,
      email: ''
    };
  },
  methods: {
    focusField() {
      $('#user-new-email').focus();
    },
    submit() {
      this
        .post('/users', { email: this.email })
        .then(user => {
          this.$emit('hide');
          this.alerts = [];
          this.email = '';
          this.$emit('create', user);
        })
        .catch(() => {});
    }
  }
};
</script>
