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
  <div id="page-head" class="row">
    <div class="col-xs-12">
      <div id="page-head-title-infonav">
        <div id="page-head-title" class="h1" v-tooltip.text><slot name="title"></slot></div>
        <slot name="infonav"></slot>
      </div>
      <div id="page-description"><slot name="description"></slot></div>
      <ul id="page-head-tabs" class="nav nav-tabs">
        <slot name="tabs"></slot>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'PageHead'
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#page-head {
  background-color: $color-subpanel-background;
  border-bottom: 1px solid $color-subpanel-border-strong;
}

.breadcrumbs + #page-head .h1 {
  margin-top: 0;
}

#page-head-title-infonav {
  padding-top: 5px;
  padding-bottom: 20px;
  display: flex;
  align-items: center;
}

#page-head-title {
  overflow-wrap: break-word;
  overflow: hidden;
}

#page-head-body {
  color: #555;
  font-size: 15px;
  letter-spacing: -0.01em;
  // If #page-head-body is empty, this margin will collapse with the bottom
  // margin of #page-head-title. As a result, there will always be exactly 15px
  // between #page-head-tabs and the previous visible element.
  margin-bottom: 15px;
}

#page-head-tabs {
  > li {
    &:only-child {
      display: none;
    }

    &.active > a {
      &, &:hover, &:focus {
        background-color: $color-subpanel-active;
      }
    }
  }

  .badge { margin-left: 2px; }
}
</style>
