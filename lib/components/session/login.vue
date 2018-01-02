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
    <page-head>
      <template slot="title">Log in</template>
    </page-head>
    <page-body>
    <alerts :list="alerts" @dismiss="dismissAlert"/>
    <app-form @submit="logIn">
      <div class="form-group">
        <label for="email">Email address</label>
        <input type="email" v-model="email" id="email" class="form-control"
          placeholder="Email" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" v-model="password" id="password"
          class="form-control" placeholder="Password" required>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="awaitingResponse">
        Log in
      </button>
    </app-form>
    </page-body>
  </div>
</template>

<script>
import axios from 'axios';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  mixins: [alert, request],
  data() {
    console.log(this);
    return {
      alerts: [],
      email: '',
      password: '',
      awaitingResponse: false
    };
  },
  methods: {
    updateHeader() {
      const headers = axios.defaults.headers.common;
      headers.Authorization = `Bearer ${this.$session.token}`;
    },
    routeToNext() {
      let path = '/forms';
      const { next } = this.$route.query;
      if (next != null) {
        const link = document.createElement('a');
        link.href = next;
        if (link.host === window.location.host) path = link.pathname;
      }
      this.$router.push(path);
    },
    logIn() {
      const data = { email: this.email, password: this.password };
      this
        .post('/sessions', data)
        .then(response => {
          const success = this.$session.set(response.data);
          if (success) {
            this.updateHeader();
            this.routeToNext();
          } else {
            console.log(response.data);
            this.danger.message = 'Something went wrong while logging you in.';
            this.danger.state = true;
          }
        })
        .catch(error => console.error(error));
    }
  }
};
</script>
