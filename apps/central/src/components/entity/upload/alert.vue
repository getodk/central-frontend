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
  <div class="entity-upload-alert" :class="type">
    <p>
      <span :class="iconClass"></span>
      <slot name="title"></slot>
      <template v-if="ranges != null">
        <span>&nbsp;</span>
        <i18n-list v-slot="{ value: [start, end] }" :list="ranges"
          class="entity-upload-alert-ranges">
          <a href="#" @click.prevent="$emit('rows', [start - 1, end - 1])">
            {{ formatRange(start, end) }}
          </a>
        </i18n-list>
      </template>
    </p>
    <slot name="body"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import I18nList from '../../i18n/list.vue';

import { useI18nUtils } from '../../../util/i18n';

defineOptions({
  name: 'EntityUploadAlert'
});
const props = defineProps({
  type: {
    type: String,
    required: true
  },
  ranges: Array
});
defineEmits(['rows']);

const iconClass = computed(() =>
  (props.type === 'warning' ? 'icon-warning' : 'icon-exclamation-circle'));

const { formatRange } = useI18nUtils();
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-upload-alert {
  border-radius: 12px;
  padding: 10px 15px;

  // Title
  > :first-child {
    @include line-clamp(2);
    margin-bottom: 10px;

    &:last-child { margin-bottom: 0; }

    // Icon
    > :first-child { margin-right: $margin-right-icon; }
  }

  + .entity-upload-alert { margin-top: 5px; }

  &.warning {
    background-color: $color-warning-light;
    > :first-child { color: $color-warning-dark; }
  }
  &.danger {
    background-color: $color-danger-light;
    > :first-child { color: $color-danger; }
  }
}

.entity-upload-alert-ranges {
  margin-left: 3px;
}
</style>
