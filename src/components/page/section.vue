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
  <div class="page-section" :class="{ horizontal }">
    <div class="page-section-heading">
      <!-- The first element of this slot should be a <span> element that
      contains the title of the page section. -->
      <slot name="heading"></slot>
    </div>
    <div class="page-section-body">
      <slot name="body"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageSection',
  props: {
    horizontal: Boolean
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.page-section {
  margin-bottom: 20px;

  &.horizontal { display: flex; }
}

.page-section-heading {
  font-size: 30px;
  margin-bottom: 10px;
  position: relative;

  .page-section.horizontal & {
    line-height: 1;
    margin-bottom: 0;
    margin-right: 20px;
  }

  > span:first-child {
    color: $color-accent-primary;
    font-weight: 600;

    + .btn { margin-left: 24px; }
    ~ .btn {
      position: relative;
      top: -2px;
    }
  }
}
</style>
