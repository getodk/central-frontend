<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="summary-item">
    <linkable :to="to" :clickable="clickable"
      class="summary-item-icon-container" @click="$emit('click')">
      <span :class="`icon-${icon}`"></span>
    </linkable>
    <div class="summary-item-heading">
      <linkable :to="to" :clickable="clickable" @click="$emit('click')">
        <slot name="heading"></slot>
      </linkable>
    </div>
    <div class="summary-item-body">
      <linkable :to="to" :clickable="clickable" @click="$emit('click')">
        <slot name="body"></slot>
      </linkable>
    </div>
  </div>
</template>

<script>
import Linkable from './linkable.vue';

export default {
  name: 'SummaryItem',
  components: { Linkable },
  props: {
    to: String,
    clickable: Boolean,
    icon: {
      type: String,
      required: true
    }
  },
  emits: ['click']
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

$icon-font-size: 56px;

.summary-item {
  margin-bottom: 30px;
  min-height: $icon-font-size;
  position: relative;
}

.summary-item-icon-container {
  position: absolute;

  [class^="icon-"] {
    color: #555;
    font-size: $icon-font-size;
  }
}
a.summary-item-icon-container [class^="icon-"] { margin-right: 0; }

.summary-item-heading, .summary-item-body { margin-left: 75px; }

.summary-item-heading {
  @include text-overflow-ellipsis;
  font-size: 30px;
  line-height: 35px;

  .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    vertical-align: 2px;
  }
  a .icon-angle-right { margin-right: 0; }
}

.summary-item-body {
  color: #666;

  strong {
    color: $color-text;
    font-weight: normal;
  }
}
</style>
