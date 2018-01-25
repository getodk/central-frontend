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
  <div id="session-login" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default">
        <div id="session-login-heading" class="panel-heading">
          <h1 class="panel-title">Log in</h1>
        </div>
        <div class="panel-body">
          <alert v-bind="alert" @close="alert.state = false"/>
          <app-form @submit="submit">
            <label class="form-group">
              <input type="email" v-model.trim="email" id="session-login-email"
                class="form-control" placeholder="Email address *" required autocomplete="off">
              <span class="form-label">Email address *</span>
            </label>
            <label class="form-group">
              <input type="password" v-model="password" id="session-login-password"
                class="form-control" placeholder="Password *" required>
              <span class="form-label">Password *</span>
            </label>
            <div class="panel-footer">
              <button type="submit" class="btn btn-primary" :disabled="disabled">
                Log in <spinner :state="disabled"/>
              </button>
            </div>
          </app-form>
        </div>
      </div>
    </div>
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
      alert: alert.blank(),
      requestId: null,
      disabled: false,
      email: '',
      password: ''
    };
  },
  methods: {
    problemToAlert(problem) {
      return problem.code === 401.2
        ? 'Incorrect email address and/or password.'
        : null;
    },
    validateSessionJson(json) {
      try {
        return new Session(json);
      } catch (e) {
        console.log(json); // eslint-disable-line no-console
        this.alert = alert.danger('Something went wrong while creating a session.');
        throw e;
      }
    },
    fetchUser(session) {
      const headers = { Authorization: `Bearer ${session.token}` };
      return this
        .get('/users/current', { headers })
        .then(userJson => ({ session, userJson }));
    },
    validateUserJson({ session, userJson }) {
      try {
        return { session, user: new User(userJson) };
      } catch (e) {
        console.log(userJson); // eslint-disable-line no-console
        this.alert = alert.danger('Something went wrong while retrieving the current user.');
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
    submit() {
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

<style lang="sass">
@import '../../../assets/scss/variables';

#session-login {
  margin-top: 70px;

  .panel {
    border: none;
    border-radius: 0;
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.25), 0 35px 115px rgba(0, 0, 0, 0.28);
  }
  .panel-body {
    padding: 25px 15px;
  }
  .panel-footer {
    background: $color-subpanel-background;
    border-top-color: $color-subpanel-border;
    margin: -15px;
    margin-bottom: -25px;
    margin-top: 20px;
  }
}

#session-login-heading {
  background-color: $color-accent-primary;
  border-radius: 0;
  color: #fff;

  h1 {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: -0.02em;
  }
}
</style>
