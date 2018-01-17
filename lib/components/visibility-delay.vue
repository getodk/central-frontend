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

<!-- This component is used to delay the visibility of content. For example, a
loading indicator should appear a short delay after the app starts loading a
resource so that the loading indicator does not flicker if the server responds
immediately. -->
<template>
  <div v-show="show" :style="style">
    <slot></slot>
  </div>
</template>

<script>
const DELAY = 250;

export default {
  props: {
    // state indicates the requested visibility of the component. The actual
    // visibility of the component (stored in this.show) may lag behind this by
    // a short interval.
    state: Boolean,
    // Indicates whether the <div> is inline.
    inline: Boolean
  },
  data() {
    return {
      // The actual visibility of the component: true if the component's content
      // is currently visible and false if not.
      show: false,
      /*
      id is a unique ID used to manage the edge case where VisibilityDelay's
      parent component asks VisibilityDelay to make its content visible, but
      during the delay before VisibilityDelay does so, the parent component
      makes multiple additional requests for VisibilityDelay to toggle the
      visibility of its content. For example, suppose that whenever the app
      POSTs a resource, it shows a spinner after a delay. Suppose that the user
      POSTs a resource, but during that delay before the spinner appears, the
      POST immediately fails, the user makes another POST that immediately
      fails, then makes another POST that is still pending when the delay
      elapses. In that case, the app should not show the spinner: it should show
      it only after an additional delay has elapsed since the last POST.
      */
      id: 0
    };
  },
  computed: {
    style() {
      return this.inline ? { display: 'inline' } : {};
    }
  },
  mounted() {
    this.toggleVisibility();
  },
  watch: {
    state: 'toggleVisibility'
  },
  methods: {
    toggleVisibility() {
      this.id += 1;
      if (this.state) {
        const idBeforeTimeout = this.id;
        setTimeout(() => {
          if (this.id === idBeforeTimeout) this.show = true;
        }, DELAY);
      } else {
        this.show = false;
      }
    }
  }
};
</script>
