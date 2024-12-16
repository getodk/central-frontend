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
  <dt class="dl-data-dt"><span v-tooltip.text>{{ name }}</span></dt>

  <dd v-if="value == null || value === ''" class="dl-data-dd empty">
    {{ $t('common.emptyValue') }}
  </dd>
  <dd v-else class="dl-data-dd"><div v-tooltip.text>{{ value }}</div></dd>
</template>

<script setup>
defineOptions({
  name: 'DlData'
});
defineProps({
  // "key" would have been a nice name for this prop, but sadly that's a
  // reserved name.
  name: {
    type: String,
    required: true
  },
  value: String
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.dl-data-dt { @include text-overflow-ellipsis; }

.dl-data-dd {
  div {
    @include line-clamp(3);
    overflow-wrap: break-word;
    white-space: break-spaces;
  }

  &.empty {
    @include italic;
    color: #888;
  }
}
</style>
