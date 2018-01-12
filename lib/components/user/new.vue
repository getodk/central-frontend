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
  <modal :state="state" @hide="$emit('hide')" backdrop>
    <template slot="title">Create Staff User</template>
    <template slot="body">
      <alerts :list="alerts" @dismiss="dismissAlert"/>
      <app-form @submit="submit">
        <div class="form-group">
          <label for="email">Email address *</label>
          <input type="email" v-model.trim="form.email" id="email"
            class="form-control" placeholder="Email" required
            @keyup.enter="submit">
        </div>
        <div class="form-group">
          <label for="password">Password *</label>
          <input :type="passwordType" v-model="form.password" id="password"
            class="form-control" placeholder="Password" required
            @keyup.enter="submit">
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" v-model="form.showPassword"> Show Password
          </label>
        </div>
      </app-form>
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
      form: this.blankForm()
    };
  },
  computed: {
    passwordType() {
      return this.form.showPassword ? 'text' : 'password';
    }
  },
  methods: {
    blankForm() {
      return {
        email: '',
        showPassword: false,
        password: ''
      };
    },
    submit() {
      const data = { email: this.form.email, password: this.form.password };
      this
        .post('/users', data)
        .then(user => {
          this.$emit('hide');
          this.alerts = [];
          this.form = this.blankForm();
          this.$emit('create', user);
        })
        .catch(() => {});
    }
  }
};
</script>
