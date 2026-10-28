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
        <linkable :to="link.path">
          <span v-if="link.icon" :class="link.icon"></span>
          {{ link.text }}
        </linkable>
      </div>
      <span v-if="index < links.length - 1" class="separator">/</span>
    </template>
  </div>
</template>

<script setup>
import Linkable from './linkable.vue';

defineProps({
  links: {
    type: Array,
    required: true,
    validator(value) {
      return value.every(link => 'text' in link);
    }
  }
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';
.breadcrumbs {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  @include text-overflow-ellipsis;
  font-size: 16px;
  max-width: 275px;
  color: $color-input;

  a {
    padding: 5px;

    [class^="icon-"] {
      margin-left: 0;
      margin-right: 3px;
    }
  }
}

.separator {
  padding: 0px 10px;
  color: $color-input;
}
</style>
