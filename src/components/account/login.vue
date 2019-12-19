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
          <form @submit.prevent="submit">
            <label class="form-group">
              <input ref="email" v-model.trim="email" type="email"
                class="form-control" placeholder="Email address *" required
                autocomplete="off">
              <span class="form-label">Email address *</span>
            </label>
            <label class="form-group">
              <input v-model="password" type="password" class="form-control"
                placeholder="Password *" required
                autocomplete="current-password">
              <span class="form-label">Password *</span>
            </label>
            <div class="panel-footer">
              <button :disabled="disabled" type="submit"
                class="btn btn-primary">
                Log in <spinner :state="disabled"/>
              </button>
              <router-link :to="resetPasswordLocation" :disabled="disabled"
                tag="button" type="button" class="btn btn-link">
                Reset password
              </router-link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

export default {
  name: 'AccountLogin',
  components: { Spinner },
  mixins: [request()],
  data() {
    return {
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
  mounted() {
    this.$refs.email.focus();
  },
  beforeRouteLeave(to, from, next) {
    if (this.disabled) {
      next(false);
    } else {
      next();
    }
  },
  methods: {
    nextPath() {
      const { next } = this.$route.query;
      if (next == null) return '/';
      const link = document.createElement('a');
      link.href = next;
      return link.host === window.location.host ? link.pathname : '/';
    },
    routeToNext() {
      const query = Object.assign({}, this.$route.query);
      delete query.next;
      this.$router.push({ path: this.nextPath(), query });
    },
    submit() {
      this.disabled = true;
      this.request({
        method: 'POST',
        url: '/sessions',
        data: { email: this.email, password: this.password },
        problemToAlert: ({ code }) => (code === 401.2
          ? 'Incorrect email address and/or password.'
          : null)
      })
        .then(({ data }) => this.$store.dispatch('get', [{
          key: 'currentUser',
          url: '/users/current',
          headers: { Authorization: `Bearer ${data.token}` },
          extended: true,
          success: () => {
            this.$store.commit('setData', { key: 'session', value: data });
          }
        }]))
        .finally(() => {
          this.disabled = false;
        })
        .then(() => {
          this.routeToNext();
        })
        .catch(noop);
    }
  }
};
</script>
