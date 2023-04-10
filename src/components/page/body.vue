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
    <div class="col-xs-12">
      <slot></slot>
    </div>
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
  row: true,
  // `router` may be `null` in testing.
  'full-width': router != null && router.currentRoute.value.meta.fullWidth
}));
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#page-body {
  margin-top: $margin-top-page-body;

  max-width: $max-width-page-body;
  &.full-width { max-width: none; }
}
</style>
