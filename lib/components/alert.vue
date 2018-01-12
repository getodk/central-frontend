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
  <div v-show="state" :class="htmlClass" role="alert">
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
    state: Boolean,
    type: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    }
  },
  computed: {
    htmlClass() {
      return ['alert', 'alert-dismissable', `alert-${this.type}`];
    }
  }
};
</script>
