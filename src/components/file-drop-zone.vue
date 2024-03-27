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
  <div class="file-drop-zone"
    :class="{ styled, disabled, dragover: dragging && !disabled }"
    @dragenter="dragenter" @dragover="dragover" @dragleave="dragleave" @drop="drop">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  disabled: Boolean,
  styled: {
    type: Boolean,
    default: true
  }
});
const emit = defineEmits(['dragenter', 'dragleave', 'drop']);

// A dragleave event is triggered when the user drags out of a particular
// element, but we also want to know when the user has left the drop zone as a
// whole. `depth` is used to track this: depth.value > 0 if the user is
// currently dragging over the drop zone, and depth.value === 0 if the user has
// dragged out of the drop zone or has dropped their file(s).
const depth = ref(0);
const noFiles = (event) =>
  !event.dataTransfer.types.some(type => type === 'Files');
// When there is a pair of associated dragenter and dragleave events, the
// dragenter event should be triggered before the dragleave event.
const dragenter = (event) => {
  if (noFiles(event)) return;
  // I have encountered conflicting information about whether to prevent the
  // default action of dragenter events. It seems to be needed to support IE 11.
  event.preventDefault();
  // Update depth.value even if props.disabled is `true` so that depth.value is
  // correct if/when props.disabled becomes `false`.
  depth.value += 1;
  if (!props.disabled) emit('dragenter', event);
};
const dragover = (event) => {
  if (noFiles(event)) return;
  event.preventDefault();
  // eslint-disable-next-line no-param-reassign
  event.dataTransfer.dropEffect = props.disabled ? 'none' : 'copy';
};
const dragleave = (event) => {
  if (noFiles(event)) return;
  depth.value -= 1;
  if (!props.disabled) emit('dragleave', event, depth.value === 0);
};
const drop = (event) => {
  if (noFiles(event)) return;
  event.preventDefault();
  depth.value = 0;
  if (!props.disabled) emit('drop', event);
};

const dragging = computed(() => depth.value !== 0);
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.file-drop-zone.styled {
  @include form-control-background;
  @include clearfix;
  border: 1px dashed $color-subpanel-border;
  margin-bottom: 20px;
  padding: $padding-file-drop-zone;
  text-align: center;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &.dragover { opacity: 0.65; }
}
</style>
