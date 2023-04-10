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
  <div id="page-body" :class="htmlClass">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'PageBody'
};
</script>
<script setup>
import { computed, inject } from 'vue';

const { router } = inject('container');
const htmlClass = computed(() => ({
  // `router` may be `null` in testing.
  bound: router == null || !router.currentRoute.value.meta.fullWidth,
  centered: window.centralOptions?.left !== true
}));
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#page-body {
  @include clearfix;
  margin-top: $margin-top-page-body;

  &.bound { max-width: $max-width-page-body; }

  &.centered {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
