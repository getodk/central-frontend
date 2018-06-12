<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="account-login" class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading"><h1 class="panel-title">Log in</h1></div>
        <div class="panel-body">
          <alert v-bind="alert" @close="alert.state = false"/>
          <app-form @submit="submit">
            <label class="form-group">
              <input v-model.trim="email" type="email" class="form-control"
                placeholder="Email address *" required autocomplete="off">
              <span class="form-label">Email address *</span>
            </label>
            <label class="form-group">
              <input v-model="password" type="password" class="form-control"
                placeholder="Password *" required>
              <span class="form-label">Password *</span>
            </label>
            <div class="panel-footer">
              <button :disabled="disabled" type="submit"
                class="btn btn-primary">
                Log in <spinner :state="disabled"/>
              </button>
              <router-link :to="resetPasswordLocation" tag="button"
                type="button" class="btn btn-link">
                Reset password
              </router-link>
            </div>
          </app-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';
import { logIn } from '../../session';

const DEFAULT_NEXT_PATH = '/forms';

export default {
  name: 'AccountLogin',
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
  computed: {
    resetPasswordLocation() {
      return {
        path: '/reset-password',
        query: Object.assign({}, this.$route.query)
      };
    }
  },
  methods: {
    problemToAlert(problem) {
      return problem.code === 401.2
        ? 'Incorrect email address and/or password.'
        : null;
    },
    fetchUser(session) {
      const headers = { Authorization: `Bearer ${session.token}` };
      return this
        .get('/users/current', { headers })
        .then(({ data }) => ({ session, user: data }));
    },
    nextPath() {
      const { next } = this.$route.query;
      if (next == null) return DEFAULT_NEXT_PATH;
      const link = document.createElement('a');
      link.href = next;
      return link.host === window.location.host
        ? link.pathname
        : DEFAULT_NEXT_PATH;
    },
    routeToNext() {
      this.$alert = alert.success('You have logged in successfully.');
      const query = Object.assign({}, this.$route.query);
      delete query.next;
      this.$router.push({ path: this.nextPath(), query });
    },
    submit() {
      this.disabled = true;
      this
        .post('/sessions', { email: this.email, password: this.password })
        .then(({ data }) => this.fetchUser(data))
        .then(({ session, user }) => logIn(session, user))
        .then(() => this.routeToNext())
        .catch(() => {
          this.disabled = false;
        });
    }
  }
};
</script>
