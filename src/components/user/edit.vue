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
    <page-head v-show="user.dataExists">
      <template v-if="user.dataExists" #title>{{ user.displayName }}</template>
    </page-head>
    <page-body>
      <loading :state="user.initiallyLoading"/>
      <div v-show="user.dataExists" class="row">
        <div class="col-xs-7">
          <user-edit-basic-details v-if="user.dataExists"/>
        </div>
        <div class="col-xs-5">
          <user-edit-password/>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
export default {
  name: 'UserEdit'
};
</script>
<script setup>
import { useRoute } from 'vue-router';

import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import UserEditBasicDetails from './edit/basic-details.vue';
import UserEditPassword from './edit/password.vue';

import useUser from '../../request-data/user';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { setDocumentTitle } from '../../util/reactivity';

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const user = useUser();
user.request({ url: apiPaths.user(props.id) }).catch(noop);

const route = useRoute();
if (route.meta.title == null) setDocumentTitle(() => [user.displayName]);
</script>
