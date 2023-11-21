<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="entity-diff" :class="conflictClass">
    <entity-diff-head v-if="entityVersion.conflict != null" v-model="diffProp"/>
    <entity-diff-table v-if="entityVersion.conflict != null || diff.length !== 0"
      :diff="diff"/>
    <p v-if="diff.length === 0" class="empty-table-message">
      {{ $t('noChange') }}
    </p>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';

import EntityDiffTable from './diff/table.vue';
import EntityDiffHead from './diff/head.vue';

defineOptions({
  name: 'EntityDiff'
});
const entityVersion = inject('entityVersion');

const conflictClass = entityVersion.conflict != null
  ? `${entityVersion.conflict}-conflict`
  : null;

const diffProp = ref('baseDiff');
const diff = computed(() => entityVersion[diffProp.value]);
</script>

<style lang="scss">
@import '../../assets/scss/variables';

$border-width: 1px;
.entity-diff {
  border-left: $border-width solid transparent;
  border-right: $border-width solid transparent;
  &.hard-conflict, &.soft-conflict {
    border-bottom: $border-width solid transparent;
    border-top: $border-width solid transparent;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  &.hard-conflict { border-color: $color-danger; }
  &.soft-conflict { border-color: $color-warning-dark; }

  .empty-table-message { margin-left: $hpadding-feed-entry; }
}

// The styles below are here rather than in EntityDiffHead because they
// reference $border-width.

.entity-diff-head {
  $hpadding: #{$hpadding-feed-entry - $border-width};
  padding-left: $hpadding;
  padding-right: $hpadding;
}

.entity-diff-table {
  col:nth-child(1) {
    // 150px for the text (the property name)
    width: #{$hpadding-feed-entry - $border-width + 150px + $padding-right-table-data};
  }
  col:nth-child(3) { width: 30px; }

  td:first-child { padding-left: #{$hpadding-feed-entry - $border-width}; }
  td:last-child { padding-right: #{$hpadding-feed-entry - $border-width}; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "noChange": "There are no changes to show."
  }
}
</i18n>
