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
  <div v-show="state" class="action-bar-container">
    <div class="action-bar" role="alert">
      <div class="close-container">
        <button type="button" class="close" :aria-disabled="disableClose"
          :aria-label="$t('action.close')" @click="$emit('hide')">
          <span aria-hidden="true" class="icon-times-circle"></span>
        </button>
      </div>
      <div class="message"><span>{{ message }}</span></div>
      <div class="cta-container">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  state: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  disableClose: Boolean
});

defineEmits(['hide']);
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/mixins';

.action-bar-container {
  @include floating-container;

  .action-bar {
    box-shadow: $m3-elevation-light-3;
    background-color: #333;
    color: #fff;
    display: flex;
    align-items: center;
    border-radius: 4px;

    .message {
      flex-grow: 1;
      padding: 15px;
      padding-right: 62px;
    }

    .cta-container,
    .close-container {
      flex-shrink: 0;
      justify-content: center;
    }

    .cta-container {
      padding-inline: 10px 18px;
    }

    .close-container {
      padding-inline: 10px 0;
    }

    .close {
      opacity: 1;
      color: #fff;
    }
  }
}
</style>
