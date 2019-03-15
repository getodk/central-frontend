<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-show="state" :class="htmlClass" :key="atEpoch" role="alert">
    <!-- When the button is clicked, we simply hide the alert, rather than using
    Bootstrap's alert plugin and calling $(...).alert('close'): the plugin would
    remove the alert from the DOM. -->
    <button type="button" class="close" aria-label="Close" @click="hideAlert">
      <span aria-hidden="true">&times;</span>
    </button>
    <span class="alert-message">{{ message }}</span>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';

export default {
  name: 'Alert',
  computed: {
    ...mapState({
      type: (state) => state.alert.type,
      message: (state) => state.alert.message,
      state: (state) => state.alert.state,
      at: (state) => state.alert.at
    }),
    htmlClass() {
      return ['alert', 'alert-dismissible', `alert-${this.type}`];
    },
    atEpoch() { return this.at.getTime(); }
  },
  methods: mapMutations(['hideAlert'])
};
</script>

<style lang="sass">
@import '../../assets/scss/variables';

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

  &.alert-success {
    background-color: $color-success-light;
    border-top-color: $color-success;
    color: $color-success;
  }

  &.alert-info {
    background-color: $color-info-light;
    border-top-color: $color-info;
    color: $color-info;
  }

  &.alert-danger {
    background-color: $color-danger-light;
    border-top-color: $color-danger;
    color: $color-danger;
  }
}
</style>
