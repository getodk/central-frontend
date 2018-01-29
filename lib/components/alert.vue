<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-show="state" :class="htmlClass" :key="atEpoch" role="alert">
    <!-- Instead of using Boostrap's alert plugin, which would remove the alert
    from the DOM, we simply emit a close event, for which the parent component
    should listen. -->
    <button type="button" class="close" aria-label="Close" @click="$emit('close')">
      <span aria-hidden="true">&times;</span>
    </button>
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'Alert',
  props: {
    state: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    at: {
      type: Date,
      required: true
    }
  },
  computed: {
    htmlClass() {
      return ['alert', 'alert-dismissable', `alert-${this.type}`];
    },
    atEpoch() { return this.at.getTime(); }
  }
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

  &.alert-danger {
    background-color: #ffe6e6;
    border-top-color: #de0500;
    color: #de0500;
  }
  &.alert-success {
    background-color: #ddf1d5;
    border-top-color: #0d840f;
    color: #0d840f;
  }
}
</style>

