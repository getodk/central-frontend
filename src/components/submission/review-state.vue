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
  <span :class="htmlClass">
    <span v-tooltip.sr-only :class="reviewStateIcon(value)"></span>
    <span :class="{ 'sr-only': tooltip }">
      <slot>{{ $t(`reviewState.${value}`) }}</slot>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

import useReviewState from '../../composables/review-state';

defineOptions({
  name: 'SubmissionReviewState'
});
const props = defineProps({
  value: String,
  // If `false` (the default), text will be shown next to the icon. If `true`, a
  // tooltip will be added on the icon instead.
  tooltip: Boolean,
  // `true` to give the text the same color as the icon.
  colorText: Boolean,
  // Useful when there is a list or column of review states, with a review state
  // on each row. In that case, specifying `true` for `align` will align the
  // review state icons with one another. This is needed because different icons
  // have different widths.
  align: Boolean
});

const htmlClass = computed(() => {
  const result = ['submission-review-state'];
  if (props.value != null) result.push(props.value);
  if (props.colorText) result.push('color-text');
  if (props.align) result.push('align');
  return result;
});

const { reviewStateIcon } = useReviewState();
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.submission-review-state {
  @mixin review-state-color($color) {
    & [class^="icon-"], &.color-text span:last-child { color: $color; }
  }
  @include review-state-color(#999);
  &.hasIssues { @include review-state-color($color-warning); }
  &.edited { @include review-state-color(#666); }
  &.approved { @include review-state-color($color-success); }
  &.rejected { @include review-state-color($color-danger); }

  // Minimize the CSS specificity to make it easy to override this style (e.g.,
  // in FeedEntry).
  :where(&) [class^="icon-"] { margin-right: $margin-right-icon; }

  &.align {
    .icon-dot-circle-o, .icon-pencil, .icon-check-circle, .icon-times-circle {
      padding-left: 1px;
      padding-right: 1px;
    }
  }
}
</style>
