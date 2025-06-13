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
  <div v-show="alert.state" id="alerts">
    <Toast v-show="alert.last === toast"/>
    <Red-Alert v-show="alert.last === redAlert"/>
  </div>
</template>

<script setup>
import { inject } from 'vue';

import RedAlert from './red-alert.vue';
import Toast from './toast.vue';

const { alert, toast, redAlert } = inject('container');
</script>

<style lang="scss">
@import '../assets/scss/variables';

#alerts {
  display: flex;
  flex-direction: column;
  align-items: center;

  position: fixed;
  left: 10vw;
  width: 80vw;
  bottom: 34px;
  z-index: $z-index-toast;
  pointer-events: none;

  .alert {
    margin-bottom: 0;
    pointer-events: auto;
  }

  body.modal-open & .red-alert { display: none; }
}
</style>
