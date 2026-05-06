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
  <div ref="el" class="hover-card">
    <div class="hover-card-heading">
      <span :class="`icon-${icon}`"></span>
      <div>
        <div class="hover-card-title"><slot name="title"></slot></div>
        <div class="hover-card-subtitle"><slot name="subtitle"></slot></div>
      </div>
    </div>
    <div class="hover-card-body" :class="{ 'truncate-dt': truncateDt }">
      <slot name="body"></slot>
    </div>
    <div class="hover-card-footer"><slot name="footer"></slot></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

import { px, styleBox } from '../util/dom';

defineOptions({
  name: 'HoverCard'
});
const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  /* By default, <dt> elements will be truncated if their width exceeds 50% of
  the hover card. However, if <dt> elements have a known fixed width -- if their
  text is not user-provided or arbitrarily long -- then we don't want to
  truncate them. (You can't hover over a hover card, so we can't show a tooltip
  over truncated text.) That said, we still generally don't want the width of a
  <dt> to exceed 50% of the hover card (to be wider than the <dd>). With that in
  mind, if truncateDt is `false`, there will be no restriction on the width of
  <dt> elements, but the width of <dd> elements will be allowed to grow up to
  the width of the <dt> elements. */
  truncateDt: {
    type: Boolean,
    default: true
  }
});

const el = ref(null);
// Returns the desired width of .hover-card-body based on the width of the <dl>.
// Returning 0 means that the default width should be used.
const computeWidth = (body) => {
  const dt = body.querySelector('dt');
  if (dt == null) return 0;

  const dtWidth = dt.getBoundingClientRect().width;
  const ddWidth = body.querySelector('dd').getBoundingClientRect().width;
  // Don't give the <dd> elements the same width as the <dt> elements unless
  // they need it. The <dt> elements are already making the hover card wider
  // than the default. The width of the <dd> elements is allowed to grow up to
  // the width of the <dt> elements, but it shouldn't grow beyond what it needs.
  return dtWidth + Math.min(dtWidth, ddWidth);
};
const resize = () => {
  if (props.truncateDt) return;

  const body = el.value.querySelector('.hover-card-body');
  const box = styleBox(getComputedStyle(body));
  const currentWidth = body.getBoundingClientRect().width -
    box.borderLeft - box.borderRight;

  // Hide siblings of .hover-card-body (i.e., .hover-card-heading and
  // .hover-card-footer) before setting `width: auto`. That way, we can compute
  // the width of the hover card based on the width of .hover-card-body alone.
  // For example, we don't want .hover-card-title to influence the width of the
  // hover card.
  const siblings = [...el.value.querySelectorAll(':scope > :not(.hover-card-body)')];
  for (const sibling of siblings) sibling.style.display = 'none';
  el.value.style.width = 'auto';

  const newWidth = computeWidth(body);

  el.value.style.width = '';
  for (const sibling of siblings) sibling.style.display = '';

  if (newWidth > currentWidth)
    el.value.style.width = px(el.value.getBoundingClientRect().width + newWidth - currentWidth);
};
onMounted(resize);
</script>

<style lang="scss">
@import '../assets/scss/mixins';

$border: 1px solid #fff;
$border-radius: 12px;

.popover:has(.hover-card) { border-radius: $border-radius; }
.hover-card { width: 290px; }

.hover-card-heading {
  // Used to align the top of the icon with the top of the text.
  $icon-margin-top: 2px;

  background-color: #666;
  border-inline: $border;
  border-top: $border;
  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;
  color: #fff;
  display: flex;
  line-height: 1.2;
  padding: #{$padding-panel-body - $icon-margin-top} $padding-panel-body 13px;

  > [class^="icon-"] {
    flex-shrink: 0;
    font-size: 26px;
    margin-right: 10px;
    margin-top: $icon-margin-top;
  }

  // Needed for .hover-card-title to truncate.
  > div { overflow: hidden; }
}

.hover-card-title {
  @include text-overflow-ellipsis;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1px;
}

.hover-card-subtitle { font-size: 12px; }

.hover-card-body {
  background-color: #fff;
  border-inline: $border;

  dl {
    grid-template-columns: max-content 1fr;
    margin-bottom: 0;
    padding-block: $padding-block-dl;
  }

  dd:not(.dl-data-dd) { @include text-overflow-ellipsis; }

  &.truncate-dt {
    dl { grid-template-columns: fit-content(50%) 1fr; }
    dt:not(.dl-data-dt) { @include text-overflow-ellipsis; }
  }
}

.hover-card-footer {
  background-color: #ddd;
  border-inline: $border;

  &:empty { display: none; }
}

.hover-card-footer, .hover-card:has(.hover-card-footer:empty) .hover-card-body {
  border-bottom: $border;
  border-bottom-left-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
}
</style>
