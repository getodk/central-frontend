<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="summary-item">
    <router-link v-if="routeTo != null" :to="routeTo"
      class="summary-item-icon-container summary-item-link">
      <span :class="iconClass"></span>
    </router-link>
    <a v-else-if="clickable"
      class="summary-item-icon-container summary-item-link" href="#"
      role="button" @click.prevent="$emit('click')">
      <span :class="iconClass"></span>
    </a>
    <span v-else class="summary-item-icon-container">
      <span :class="iconClass"></span>
    </span>

    <div class="summary-item-heading">
      <router-link v-if="routeTo != null" :to="routeTo"
        class="summary-item-link">
        <slot name="heading"></slot>
      </router-link>
      <a v-else-if="clickable" class="summary-item-link" href="#" role="button"
        @click.prevent="$emit('click')">
        <slot name="heading"></slot>
      </a>
      <slot v-else name="heading"></slot>
    </div>
    <div class="summary-item-body">
      <router-link v-if="routeTo != null" :to="routeTo"
        class="summary-item-link">
        <slot name="body"></slot>
      </router-link>
      <a v-else-if="clickable" class="summary-item-link" href="#" role="button"
        @click.prevent="$emit('click')">
        <slot name="body"></slot>
      </a>
      <slot v-else name="body"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SummaryItem',
  props: {
    routeTo: String, // eslint-disable-line vue/require-default-prop
    clickable: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      required: true
    }
  },
  computed: {
    iconClass() {
      return `icon-${this.icon}`;
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

$icon-font-size: 56px;

.summary-item {
  margin-bottom: 30px;
  min-height: $icon-font-size;
  position: relative;
}

.summary-item-link {
  &, &:hover, &:focus {
    color: inherit;
    text-decoration: none;
  }
}

.summary-item-icon-container {
  position: absolute;

  span {
    color: #555;
    font-size: $icon-font-size;
  }

  &.summary-item-link span {
    margin-right: 0;
  }
}

.summary-item-heading, .summary-item-body {
  margin-left: 75px;
}

.summary-item-heading {
  font-size: 30px;
  line-height: 35px;

  .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    vertical-align: 2px;
  }

  .summary-item-link .icon-angle-right {
    margin-right: 0;
  }
}

.summary-item-body {
  color: #666;

  strong {
    color: $color-text;
    font-weight: normal;
  }
}
</style>
