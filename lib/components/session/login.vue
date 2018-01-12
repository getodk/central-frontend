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
          <input type="email" v-model.trim="email" id="email"
            class="form-control" placeholder="Email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" v-model="password" id="password"
            class="form-control" placeholder="Password" required>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="awaitingResponse">
          Log in <spinner :state="awaitingResponse"/>
        </button>
      </app-form>
    </page-body>
  </div>
</template>

<script>
import Vue from 'vue';
import axios from 'axios';

import Session from '../../session';
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'SessionLogin',
  mixins: [alert, request],
  data() {
    return {
      alerts: [],
      requestId: null,
      email: '',
      password: ''
    };
  },
  methods: {
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
      this
        .post('/sessions', { email: this.email, password: this.password })
        .then(sessionJson => {
          try {
            return new Session(sessionJson);
          } catch (e) {
            console.log(sessionJson); // eslint-disable-line no-console
            this.alerts.push('danger', 'Something went wrong while logging you in.');
            throw e;
          }
        })
        .then(session => {
          Vue.prototype.$session = session;
          axios.defaults.headers.common.Authorization = `Bearer ${session.token}`;
          this.routeToNext();
        })
        .catch(() => {});
    }
  }
};
</script>
