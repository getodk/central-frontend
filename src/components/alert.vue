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
  <div :key="alert.messageId" class="alert" role="alert">
    <div class="alert-message">{{ alert.message }}</div>
    <div v-if="cta != null" class="alert-cta-container">
      <button type="button" class="alert-cta btn btn-link"
        :aria-disabled="cta.pending" @click="cta.handler">
        {{ cta.text }}
      </button>
      <spinner :state="cta.pending"/>
    </div>
    <div class="alert-close-container">
      <button type="button" class="close" :aria-label="$t('action.close')"
        @click="alert.hide()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import Spinner from './spinner.vue';

const props = defineProps({
  alert: {
    type: Object,
    required: true
  }
});

const cta = computed(() => props.alert.cta);
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

  display: flex;
  align-items: center;

  border-radius: 4px;
  margin-bottom: 15px;
}

.alert > div {
  display: flex;
  align-items: center;
}

.alert-message {
  flex-grow: 1;
  padding: 15px;
  padding-right: 60px;
}

.alert-cta-container, .alert-close-container {
  flex-shrink: 0;
  justify-content: center;
}

.alert-cta-container {
  padding-inline: 2px;
  // Needed for Spinner
  position: relative;
}

.alert-close-container { width: 48px; }

.alert-cta {
  font-size: $font-size-text;

  &:hover, &:focus {
    background-color: transparent;
    text-decoration: none;
  }

  &[aria-disabled="true"] { opacity: 0; }
}

.alert .close {
  float: none;
  position: relative;
  top: -2px;
}
</style>
