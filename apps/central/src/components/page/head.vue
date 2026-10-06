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
      <div v-if="$slots.breadcrumbs" id="page-head-breadcrumb-row">
        <slot name="breadcrumbs"></slot>
        <slot name="infonav"></slot>
      </div>
      <div v-if="$slots.title" id="page-head-title" class="h1" v-tooltip.text>
        <slot name="title"></slot>
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

#page-head-title.h1 {
  font-size: 16px;
  margin: 20px 0;
  overflow-wrap: break-word;
  overflow: hidden;
}

#page-head-breadcrumb-row {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

#page-head-tabs {
  > li {
    &:only-child {
      display: none;
    }
  }
}
</style>
