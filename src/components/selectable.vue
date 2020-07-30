<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="selectable" @click="select">
    <!-- The slot should only contain text. -->
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'Selectable',
  methods: {
    select() {
      const selection = getSelection();
      // Select all the text unless the user has selected specific text.
      if (selection.isCollapsed) selection.selectAllChildren(this.$el);
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.selectable {
  font-family: $font-family-monospace;
  overflow-x: auto;
  white-space: nowrap;
}
</style>
