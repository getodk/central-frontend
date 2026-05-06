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
  <div class="table-scroll">
    <slot></slot>
  </div>
</template>

<script setup>
defineOptions({
  name: 'TableScroll'
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.table-scroll {
  border-bottom: $border-top-table-data;
  margin-bottom: $margin-bottom-table;
  overflow: hidden auto;
  position: relative;

  table { margin-bottom: 0; }

  thead {
    position: sticky;
    top: 0;
  }

  th:first-child { border-left: 1px solid $color-table-heading-background; }
  th:last-child { border-right: 1px solid $color-table-heading-background; }
  td:first-child { border-left: $border-top-table-data; }
  td:last-child { border-right: $border-top-table-data; }
}
</style>
