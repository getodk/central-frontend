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
<template>
  <div class="expandable-row">
    <div class="expandable-row-title">
      <slot name="title"></slot>
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="caption-cell" @click="toggleExpanded">
      <slot name="caption"></slot>
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="button-cell" @click="toggleExpanded">
      <button type="button" class="expandable-row-toggle-button btn btn-link">
        <span v-if="!expanded" class="sr-only">{{ $t('action.expand') }}</span>
        <span v-else class="sr-only">{{ $t('action.collapse') }}</span>
        <span v-if="!expanded" class="icon-caret-left"></span>
        <span v-else class="icon-caret-down"></span>
      </button>
    </div>
    <div v-show="expanded" class="expanded-row">
      <slot name="details"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({
  name: 'ExpandableRow'
});

const props = defineProps({
  initiallyExpanded: {
    type: Boolean,
    default: false
  },
});

const expanded = ref(props.initiallyExpanded);
const toggleExpanded = () => { expanded.value = !expanded.value; };
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.expandable-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;

  > div {
    padding-block: $padding-top-expandable-row;
  }

  .expandable-row-title {
    flex-grow: 1;
  }

  .caption-cell, .button-cell { cursor: pointer; }

  .caption-cell {
    text-align: right;
    flex-grow: 1;
  }

  .button-cell {
    align-self: center;
    text-align: center;
    padding-block: 0;
    width: 30px;
  }

  .expanded-row {
    width: 100%;
    padding: 0 8px $padding-bottom-expandable-row 8px;
  }
}

.expandable-row-toggle-button {
  @include text-link;
  padding: 0;
}
</style>
