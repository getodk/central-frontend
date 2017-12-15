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
  <div>
    <heading title="Log in"/>
    <alert type="danger" :message="error"/>
    <form @submit.prevent="logIn">
      <div class="form-group">
        <label for="email">Email address</label>
        <input type="email" v-model="email" ref="email" id="email"
          class="form-control" placeholder="Email" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" v-model="password" id="password"
          class="form-control" placeholder="Password" required>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="disabled">
        Log in
      </button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

import { safeBack } from '../../router';

export default {
  data() {
    return {
      email: '',
      password: '',
      error: null,
      disabled: false
    };
  },
  mounted() {
    this.$refs.email.focus();
  },
  methods: {
    logIn() {
      this.disabled = true;
      axios
        .post('/sessions', { email: this.email, password: this.password })
        .then(response => {
          const success = this.$session.set(response.data);
          if (success) {
            const headers = axios.defaults.headers.common;
            headers.Authorization = `Bearer ${this.$session.token}`;
            // Using safeBack() rather than this.$router.go(-1) in case the user
            // navigated directly to /login rather than being redirected there.
            safeBack('/forms');
          } else {
            console.error(response.data);
            this.error = 'Something went wrong while logging you in.';
            this.disabled = false;
          }
        })
        .catch(error => {
          console.error(error.response.data);
          this.error = error.response.data.message;
          this.disabled = false;
        });
    }
  }
};
</script>
