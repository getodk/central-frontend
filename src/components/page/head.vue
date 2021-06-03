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
      <div id="page-head-title" class="h1"><slot name="title"></slot></div>
      <p id="page-head-body"><slot name="body"></slot></p>
      <ul id="page-head-tabs" class="nav nav-tabs">
        <slot name="tabs"></slot>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHead'
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#page-head {
  background-color: $color-subpanel-background;
  border-bottom: 1px solid $color-subpanel-border-strong;
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
}
</style>
