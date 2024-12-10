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
<template>
  <router-link v-if="canRoute(to)" ref="link" :to="to" class="link-if-can">
    <slot></slot>
  </router-link>
  <span v-else ref="span" class="link-if-can">
    <slot></slot>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue';

import useRoutes from '../composables/routes';

defineProps({
  to: {
    type: String,
    required: true
  }
});

const { canRoute } = useRoutes();

const link = ref(null);
const span = ref(null);
const $el = computed(() => (link.value != null ? link.value.$el : span.value));

defineExpose({ $el });
</script>

<style lang="scss">
span.link-if-can {
  > .icon-angle-right:last-child { display: none; }
}
</style>
