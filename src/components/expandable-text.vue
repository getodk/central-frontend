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
  <div ref="el" class="expandable-text" :class="{ toggleable, expanded }"
    :tabindex="toggleable ? 0 : null" @click="toggle" @keydown.enter="toggle">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { truncatesText } from '../util/dom';

const truncated = ref(false);
const el = ref(null);
const setTruncated = () => { truncated.value = truncatesText(el.value); };
const resizeObserver = new ResizeObserver(setTruncated);
onMounted(() => {
  setTruncated();
  // One important case in which resizeObserver is needed is if the element is
  // initially hidden, when it's not possible to detect truncation. In that
  // case, we use resizeObserver to call setTruncated() again once the element
  // becomes visible.
  resizeObserver.observe(el.value);
});
onBeforeUnmount(() => { resizeObserver.disconnect(); });

const expanded = ref(false);
const toggleable = computed(() => truncated.value || expanded.value);
const toggle = () => {
  if (toggleable.value) expanded.value = !expanded.value;
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.expandable-text {
  &:not(.expanded) { @include line-clamp(3); }
  &.toggleable { cursor: pointer; }
}
</style>
