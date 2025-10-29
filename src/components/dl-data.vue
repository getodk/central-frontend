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

<!-- The DlData component renders a <dt> and <dd> for arbitrary key/value data
from the user, e.g., entity data. The key and value will be truncated if they
are too long. -->
<template>
  <dt class="dl-data-dt">
    <slot name="name"><span v-tooltip.text>{{ name }}</span></slot>
  </dt>

  <dd class="dl-data-dd">
    <slot name="value">
      <span v-if="value == null || value === ''" class="dl-data-empty">
        {{ $t('common.emptyValue') }}
      </span>
      <expandable-text v-else>{{ value }}</expandable-text>
    </slot>
  </dd>
</template>

<script setup>
import ExpandableText from './expandable-text.vue';

defineOptions({
  name: 'DlData'
});
defineProps({
  /*
  "key" would have been a nice name for this prop, but sadly that's a reserved
  name.

  `name` can be passed in as a prop or as a slot.
  */
  name: String,
  // `value` can be passed in as a prop or as a slot.
  value: String
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.dl-data-dt { @include text-overflow-ellipsis; }

.dl-data-dd {
  // This is needed for the line-clamp mixin to work if the component is used in
  // .dl-horizontal. See: https://github.com/getodk/central/issues/854
  overflow: hidden;

  .expandable-text {
    overflow-wrap: break-word;
    white-space: break-spaces;
  }
}

.dl-data-empty {
  @include italic;
  color: #888;
}
</style>
