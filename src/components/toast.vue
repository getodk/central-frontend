<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <alert class="toast" :alert="toast"/>
</template>

<script setup>
import { inject } from 'vue';

import Alert from './alert.vue';

const toast = inject('toast');
</script>

<style lang="scss">
@import '../assets/scss/variables';

.toast {
  background-color: #333;
  color: #fff;

  .alert-cta {
    color: $color-action-light;
    &:hover, &:focus { color: $color-action-background; }
  }
}
</style>
