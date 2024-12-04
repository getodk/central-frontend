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
  <div class="breadcrumbs row">
    <div v-for="(link, index) in links" :key="index" class="breadcrumb-item">
        <router-link :to="link.path">
        {{ link.text }}
          <span v-if="link.icon" :class="link.icon"></span>
        </router-link>
      <span class="separator">/</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  links: {
    type: Array,
    required: false,
    default: () => [],
    validator(value) {
      return value.every(link => 'text' in link && 'path' in link);
    }
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/mixins';
.breadcrumbs {
  display: flex;
  background-color: $color-subpanel-background;
  padding-top: 20px;
  padding-left: 15px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #bbb;

  [class*='icon'] {
    margin-left: 5px;
  }
}

.breadcrumb-item a{
  color: $color-accent-primary;
}

.separator {
  margin: 0 0.5rem;
}
</style>
