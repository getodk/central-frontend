<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="breadcrumbs">
    <template v-for="(link, index) in links" :key="index">
      <div class="breadcrumb-item" v-tooltip.text>
        <router-link :to="link.path">
          {{ link.text }}
          <span v-if="link.icon" :class="link.icon"></span>
        </router-link>
      </div>
      <span class="separator">/</span>
    </template>
  </div>
</template>

<script setup>
defineProps({
  links: {
    type: Array,
    required: true,
    validator(value) {
      return value.every(link => 'text' in link && 'path' in link);
    }
  }
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';
.breadcrumbs {
  display: flex;
  background-color: $color-subpanel-background;
  padding-top: 20px;
  padding-left: 15px;
  margin-inline: -15px;
}

.breadcrumb-item {
  @include text-overflow-ellipsis;
  font-size: 14px;
  max-width: 275px;

  a [class^="icon-"] {
    margin-left: 5px;
    margin-right: 0;
  }
}

.breadcrumb-item a{
  color: $color-accent-primary;
}

.separator {
  padding: 0px 9px;
  color: #bbb;
}
</style>
