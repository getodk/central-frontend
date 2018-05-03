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
  <button :disabled="disabled" type="button"
    class="btn btn-secondary btn-refresh" @click="refresh">
    <span class="icon-refresh"></span> Refresh list
    <spinner :state="refreshStatus === 'inProgress'"/>
  </button>
</template>

<script>
export default {
  name: 'RefreshButton',
  props: {
    // true if the parent component is fetching data -- either after clicking
    // the refresh button or through some other process -- and false if not.
    fetching: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    // The refresh status starts as 'notInProgress'. Once the refresh button is
    // clicked, the status moves to 'triggered'. Then, once `fetching` changes
    // to `true`, the status moves to 'inProgress'. Once `fetching` changes back
    // to `false`, the status reverts back to 'notInProgress'.
    refreshStatus: 'notInProgress'
  }),
  computed: {
    disabled() {
      return this.fetching || this.refreshStatus === 'triggered';
    }
  },
  watch: {
    fetching() {
      if (this.refreshStatus === 'notInProgress') return;
      this.refreshStatus = this.refreshStatus === 'triggered'
        ? 'inProgress'
        : 'notInProgress';
    }
  },
  methods: {
    refresh() {
      this.refreshStatus = 'triggered';
      // Once this event is emitted, the parent component should toggle
      // `fetching`.
      this.$emit('refresh');
    }
  }
};
</script>
