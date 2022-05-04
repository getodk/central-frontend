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
  <div v-show="alert.state" :key="alert.at.getTime()"
    class="alert alert-dismissible" :class="`alert-${alert.type}`" role="alert">
    <button type="button" class="close" :aria-label="$t('action.close')"
      @click="alert.blank()">
      <span aria-hidden="true">&times;</span>
    </button>
    <span class="alert-message">{{ alert.message }}</span>
  </div>
</template>

<script>
export default {
  name: 'Alert',
  inject: ['alert']
};
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
  border: none;
  border-top: 2px solid transparent;
  border-radius: 0;
  // This only affects alerts in modals, as App's alert has a fixed position.
  margin-bottom: 15px;

  .alert-message {
    overflow-wrap: break-word;
    white-space: pre-wrap;
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
