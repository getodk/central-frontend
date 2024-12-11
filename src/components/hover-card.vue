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
  <div ref="el" class="hover-card" :style="{ width }">
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

import { px, truncatesText } from '../util/dom';

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

const width = ref('');
const el = ref(null);
const resize = () => {
  if (props.truncateDt) return;
  const dtWidth = el.value.querySelector('dt').getBoundingClientRect().width;
  const ddWidth = el.value.querySelector('dd').getBoundingClientRect().width;
  if (dtWidth > ddWidth) {
    const currentWidth = el.value.getBoundingClientRect().width;
    const equalWidth = px(currentWidth + dtWidth - ddWidth);
    const { style } = el.value;
    style.width = equalWidth;
    if (![...el.value.querySelectorAll('dd')].some(truncatesText)) {
      // Don't give the <dd> elements the same width as the <dt> elements unless
      // they need it. The <dt> elements are already making the hover card wider
      // than the default. The width of the <dd> elements is allowed to grow up
      // to the width of the <dt> elements, but it shouldn't grow beyond what it
      // needs.
      style.width = 'auto';

      // Bail if setting `width: auto` causes the width of the <dd> elements to
      // shrink.
      if (el.value.getBoundingClientRect().width < currentWidth)
        style.width = '';
    }

    // Persist the new width in width.value so that it appears in the style
    // attribute. That's needed for the style to be copied to the popover.
    width.value = style.width;
    style.width = '';
  }
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
  background-color: #666;
  border-inline: $border;
  border-top: $border;
  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;
  color: #fff;
  display: flex;
  // Align the top of the text with the top of the icon.
  line-height: 1;
  padding: $padding-panel-body;
  padding-bottom: 12px;

  > [class^="icon-"] {
    flex-shrink: 0;
    font-size: 26px;
    margin-right: 10px;
  }

  // Needed for .hover-card-title to truncate.
  > div { overflow: hidden; }
}

.hover-card-title {
  @include text-overflow-ellipsis;
  font-size: 16px;
  font-weight: 500;
  // This padding has two purposes. We need space between the title and the
  // subtitle. Since the line-height is 1, we also need space for descenders in
  // the text. It's for the latter reason that we use padding instead of margin.
  padding-bottom: 3px;
}

.hover-card-subtitle {
  font-size: 12px;
  padding-bottom: 2px;
}

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
    dt { @include text-overflow-ellipsis; }
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
