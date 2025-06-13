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
  <div v-show="alert.state" :key="alert.messageId" class="alert"
    :class="`alert-${alert.type}`" role="alert">
    <button type="button" class="close" :aria-label="$t('action.close')"
      @click="alert.hide()">
      <span aria-hidden="true">&times;</span>
    </button>
    <span class="alert-message">{{ alert.message }}</span>
    <button v-if="cta != null" type="button" class="alert-cta btn btn-default"
      :aria-disabled="cta.pending" @click="cta.handler">
      {{ cta.text }} <spinner :state="cta.pending"/>
    </button>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';

import Spinner from './spinner.vue';

const alert = inject('alert');
const cta = computed(() => alert.cta);
</script>

<style lang="scss">
@import '../assets/scss/variables';

@keyframes fadein {
  from { opacity: 0.2; }
  to { opacity: 1; }
}

.alert {
  animation-duration: 0.6s;
  animation-iteration-count: 1;
  animation-name: fadein;
  animation-timing-function: ease-out;
  border-top: 2px solid transparent;
  // This only affects alerts in modals, as App's alert has a fixed position.
  margin-bottom: 15px;
  padding: 15px;
  padding-right: 35px;

  .alert-message {
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .close {
    position: relative;
    top: -2px;
    right: -21px;
    color: inherit;
  }
}

.alert-success {
  background-color: $color-success-light;
  border-top-color: $color-success;
  color: $color-success;
}

.alert-info {
  background-color: $color-info-light;
  border-top-color: $color-info;
  color: $color-info;
}

.alert-danger {
  background-color: $color-danger-light;
  border-top-color: $color-danger;
  color: $color-danger;
}
</style>
