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
  <p v-show="show" class="text-center text-muted">Loading…</p>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    // true if the app is loading data and false if not
    state: Boolean
  },
  data() {
    return {
      // `show` is `true` if the loading message is shown and `false` if not.
      // It lags behind `state` by a short interval so that the loading message
      // does not flicker if the server responds immediately.
      show: false
    };
  },
  watch: {
    state: 'toggleMessage'
  },
  mounted() {
    this.toggleMessage();
  },
  methods: {
    toggleMessage() {
      if (this.state === true) {
        setTimeout(() => {
          if (this.state === true) this.show = true;
        }, 250);
      } else {
        this.show = false;
      }
    }
  }
};
</script>
