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

<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <textarea ref="el" class="textarea-autosize form-control"
    :class="{ 'user-resized': userResized }" :value="props.modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    @mousedown="listenForUserResize">
  </textarea>
</template>

<script setup>
// TextareaAutosize automatically sizes a textarea based on props.modelValue.
// The height of the textarea is adjusted when the component is mounted and
// whenever props.modelValue changes. The parent component can also call the
// resize() function to adjust the height, for example, after the textarea
// becomes visible.

import { nextTick, onMounted, ref, watch } from 'vue';

import { px, styleBox } from '../util/dom';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  // The min-height not including padding or borders (the min-height of the
  // textarea's content box)
  minHeight: {
    type: Number,
    default: 0
  }
});
defineEmits(['update:modelValue']);

const el = ref(null);

// Indicates whether the user has manually resized the textarea. In that case,
// the textarea will no longer be automatically resized, unless the parent
// component calls resize().
let userResized = false;
const listenForUserResize = () => {
  if (userResized) return;
  const initialHeight = el.value.getBoundingClientRect().height;

  // Remove style.minHeight temporarily so that the user can resize the textarea
  // to less than style.minHeight.
  const { style } = el.value;
  const { minHeight: minHeightStyle } = style;
  style.minHeight = px(0);
  // Set style.height in case style.height < style.minHeight. Unlike
  // style.minHeight, style.height does not seem to restrict how the user can
  // resize the textarea.
  const initialHeightStyle = style.height;
  style.height = px(initialHeight);

  const mouseup = () => {
    userResized = el.value.getBoundingClientRect().height !== initialHeight;
    if (!userResized) {
      style.height = initialHeightStyle;
      style.minHeight = minHeightStyle;
    }
    document.removeEventListener('mouseup', mouseup);
  };
  document.addEventListener('mouseup', mouseup);
};

// heightOutdated is `true` if props.modelValue has changed since the last time
// the height of the textarea was adjusted. That can happen if props.modelValue
// changes while the textarea is hidden.
let heightOutdated = false;
const setHeight = () => {
  const { style } = el.value;
  // Remove any existing style.height before calculating scrollHeight so that
  // height can be reclaimed if text has been deleted. (scrollHeight will never
  // be less than style.height as long as the textarea is visible.)
  style.height = '';
  // height and min-height should be independent because props.minHeight can
  // change without props.modelValue changing, and we don't want to call
  // setHeight() whenever props.minHeight changes. That works because if height
  // is less than min-height, it seems like min-height takes priority. Here, we
  // set min-height to 0 because otherwise `height` could never be less than
  // min-height.
  const { minHeight } = style;
  style.minHeight = px(0);
  const { scrollHeight } = el.value;
  style.minHeight = minHeight;
  if (scrollHeight !== 0) {
    const box = styleBox(getComputedStyle(el.value));
    style.height = px(scrollHeight + box.borderTop + box.borderBottom);
    heightOutdated = false;
  } else {
    heightOutdated = true;
  }
};
onMounted(setHeight);
watch(() => props.modelValue, () => { if (!userResized) nextTick(setHeight); });

const setMinHeight = () => {
  const box = styleBox(getComputedStyle(el.value));
  el.value.style.minHeight = px(props.minHeight +
    box.paddingTop + box.paddingBottom + box.borderTop + box.borderBottom);
};
onMounted(setMinHeight);
watch(() => props.minHeight, () => { if (!userResized) setMinHeight(); });

const resize = () => {
  if (heightOutdated || userResized) setHeight();
  if (userResized) {
    setMinHeight();
    userResized = false;
  }
};
const focus = () => el.value.focus();
defineExpose({ resize, focus });
</script>

<style lang="scss">
.textarea-autosize {
  resize: vertical;

  // As long as the user hasn't manually resized the textarea, we don't expect
  // to see a scrollbar. Yet we still need to set overflow-y to `hidden`:
  // otherwise a scrollbar would be present when setHeight() temporarily sets
  // the height to 0, affecting scrollHeight.
  overflow-y: hidden;
  &.user-resized { overflow-y: auto; }
}
</style>
