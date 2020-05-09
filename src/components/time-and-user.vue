<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- TODO. Add unit tests. -->
<template>
  <i18n v-if="user != null" tag="div" :path="$tPath('text')"
    class="time-and-user">
    <template #dateTime>
      <date-time :iso="iso"/>
    </template>
    <template #displayName>
      <link-if-can :to="userPath(user.id)" :title="user.displayName">{{ user.displayName }}</link-if-can>
    </template>
  </i18n>
  <div v-else>
    <date-time :iso="iso"/>
  </div>
</template>

<script>
import DateTime from './date-time.vue';
import LinkIfCan from './link-if-can.vue';
import routes from '../mixins/routes';

export default {
  name: 'TimeAndUser',
  components: { DateTime, LinkIfCan },
  mixins: [routes()],
  props: {
    iso: {
      type: String,
      required: true
    },
    user: Object // eslint-disable-line vue/require-default-prop,
  }
};
</script>

<style lang="scss">
.time-and-user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
