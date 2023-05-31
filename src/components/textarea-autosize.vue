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
  minHeight: {
    type: Number,
    default: 0
  },
  // Used in testing to mock whether the user manually resized the textarea.
  // Specifying `true` will cause a pair of mousedown and mouseup events to
  // simulate a manual resize.
  mockUserResized: Boolean
});
defineEmits(['update:modelValue']);

const el = ref(null);

// Indicates whether the user has manually resized the textarea. In that case,
// the textarea will no longer be automatically resized, unless the parent
// component calls resize().
const userResized = ref(false);
const listenForUserResize = () => {
  if (userResized.value) return;
  const mousedownHeight = el.value.getBoundingClientRect().height;

  // Set style.minHeight to 0 so that the user can resize the textarea to less
  // than style.minHeight.
  const { style } = el.value;
  const minHeightStyle = style.minHeight;
  style.minHeight = px(0);
  // Set style.height in case style.height < style.minHeight: otherwise the
  // height of the textarea might decrease immediately. Unlike for
  // style.minHeight, setting style.height does not seem to restrict how the
  // user can resize the textarea.
  const mousedownHeightStyle = style.height;
  style.height = px(mousedownHeight);

  const mouseup = () => {
    document.removeEventListener('mouseup', mouseup);
    // If the component has been unmounted, do nothing.
    if (el.value == null) return;
    const mouseupHeight = el.value.getBoundingClientRect().height;
    userResized.value = mouseupHeight !== mousedownHeight || props.mockUserResized;
    // If userResized.value is `false`, then we restore style.height and
    // style.minHeight. If userResized.value is `true`, then we leave
    // style.minHeight at 0 to ensure that there is no change to the height. We
    // also do not change style.height, as even clearing it after a user resize
    // seems to change the height of the textarea.
    if (!userResized.value) {
      style.height = mousedownHeightStyle;
      style.minHeight = minHeightStyle;
    }
  };
  document.addEventListener('mouseup', mouseup);
};

// heightOutdated is `true` if props.modelValue has changed since the last time
// the height of the textarea was adjusted. That can happen if props.modelValue
// changes while the textarea is hidden.
let heightOutdated = false;
const setHeight = () => {
  const { style } = el.value;
  // Set style.height to 0 before calculating scrollHeight so that height can be
  // reclaimed if text has been deleted: scrollHeight will never be less than
  // style.height as long as the textarea is visible. (Note that we cannot
  // simply remove style.height, because the height of the textarea would fall
  // back to a height of 2 rows, the default number of rows.)
  style.height = px(0);
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
    style.height = '';
    heightOutdated = true;
  }
};
onMounted(setHeight);
watch(() => props.modelValue, () => {
  if (!userResized.value) nextTick(setHeight);
});

const setMinHeight = () => { el.value.style.minHeight = px(props.minHeight); };
onMounted(setMinHeight);
watch(() => props.minHeight, () => { if (!userResized.value) setMinHeight(); });

const resize = () => {
  if (heightOutdated || userResized.value) setHeight();
  if (userResized.value) {
    setMinHeight();
    userResized.value = false;
  }
};
const focus = () => el.value.focus();
defineExpose({ el, resize, focus });
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
