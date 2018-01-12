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
            <button type="submit" class="btn btn-primary" :disabled="disabled">
              Log in <spinner :state="disabled"/>
            </button>
          </app-form>
    </page-body>
  </div>
</template>

<script>
import Vue from 'vue';
import axios from 'axios';

import Session from '../../session';
import User from '../../user';
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'SessionLogin',
  mixins: [alert(), request()],
  data() {
    return {
      alerts: [],
      requestId: null,
      disabled: false,
      email: '',
      password: ''
    };
  },
  methods: {
    validateSessionJson(json) {
      try {
        return new Session(json);
      } catch (e) {
        console.log(json); // eslint-disable-line no-console
        this.alerts.push('danger', 'Something went wrong while creating a session.');
        throw e;
      }
    },
    fetchUser(session) {
      return new Promise((resolve, reject) => {
        const headers = { Authorization: `Bearer ${session.token}` };
        this
          .get('/users/current', { headers })
          .then(userJson => resolve({ session, userJson }))
          .catch(error => reject(error));
      });
    },
    validateUserJson({ session, userJson }) {
      try {
        return { session, user: new User(userJson) };
      } catch (e) {
        console.log(userJson); // eslint-disable-line no-console
        this.alerts.push('danger', 'Something went wrong while retrieving the current user.');
        throw e;
      }
    },
    updateGlobals({ session, user }) {
      Vue.prototype.$session = session;
      Vue.prototype.$user = user;
      axios.defaults.headers.common.Authorization = `Bearer ${session.token}`;
    },
    routeToNext() {
      let path = '/forms';
      const { next } = this.$route.query;
      if (next != null) {
        const link = document.createElement('a');
        link.href = next;
        if (link.host === window.location.host) path = link.pathname;
      }
      const query = Object.assign({}, this.$route.query);
      delete query.next;
      this.$router.push({ path, query });
    },
    logIn() {
      this.disabled = true;
      this
        .post('/sessions', { email: this.email, password: this.password })
        .then(sessionJson => this.validateSessionJson(sessionJson))
        .then(session => this.fetchUser(session))
        .then(result => this.validateUserJson(result))
        .then(result => this.updateGlobals(result))
        .then(() => this.routeToNext())
        .catch(() => {
          this.disabled = false;
        });
    }
  }
};
</script>
