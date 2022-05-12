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
  <div>
    <page-head v-show="user != null">
      <template v-if="user != null" #title>{{ user.displayName }}</template>
    </page-head>
    <page-body>
      <loading :state="$store.getters.initiallyLoading(['user'])"/>
      <div v-show="user != null" class="row">
        <div class="col-xs-7">
          <user-edit-basic-details v-if="user != null"/>
        </div>
        <div class="col-xs-5">
          <user-edit-password/>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
import { inject } from '@vue/composition-api';

import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import UserEditBasicDetails from './edit/basic-details.vue';
import UserEditPassword from './edit/password.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';
import { watchSync } from '../../util/reactivity';

export default {
  name: 'UserEdit',
  components: {
    Loading,
    PageBody,
    PageHead,
    UserEditBasicDetails,
    UserEditPassword
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup() {
    const { store } = inject('container');
    // TODO/vue3. Could watchSyncEffect() be used instead?
    watchSync(() => store.state.request.data.user, (user) => {
      const { currentUser } = store.state.request.data;
      // We test whether `user` is `null`, because if there is a navigation
      // away, `user` will be cleared before the component is unmounted,
      // triggering the watcher.
      if (user != null && user.id === currentUser.id) {
        store.commit('setData', {
          key: 'currentUser',
          value: currentUser.with(user.object)
        });
      }
    });
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['user']),
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [
        { key: 'user', url: apiPaths.user(this.id) }
      ]).catch(noop);
    }
  }
};
</script>
