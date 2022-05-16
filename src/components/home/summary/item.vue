<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <linkable tag="div" :to="to" class="home-summary-item">
    <div class="heading">
      <span :class="`icon-${icon}`"></span>
      <div>
        <div v-if="count != null" class="count">{{ $n(count, 'default') }}</div>
        <div class="title">
          <span><slot name="title"></slot></span>
          <!-- If the Linkable is not a link, we hide the icon by making it
          transparent. We always render the icon in order to keep the height of
          .title consistent. -->
          <span class="icon-angle-right"></span>
        </div>
      </div>
    </div>
    <p class="body"><slot name="body"></slot></p>
  </linkable>
</template>

<script>
import Linkable from '../../linkable.vue';

export default {
  name: 'HomeSummaryItem',
  components: { Linkable },
  props: {
    to: String,
    icon: {
      type: String,
      required: true
    },
    count: Number
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.home-summary-item {
  .heading {
    align-items: flex-end;
    display: flex;
    margin-bottom: 4px;

    > [class^="icon-"] {
      color: #555;
      font-size: 62px;
      margin-bottom: 2px;
      margin-right: 9px;
    }
  }

  .count {
    font-size: 35px;
    line-height: 1;
    margin-bottom: -4px;
  }

  .title {
    align-items: center;
    display: flex;
    font-size: 12px;
    font-weight: 600;
  }

  .icon-angle-right {
    color: $color-accent-primary;
    font-size: 21px;
    margin-left: 7px;
  }

  .body {
    font-size: 13px;
    line-height: 1.2;
    margin-bottom: 0;
  }
}
div.home-summary-item .icon-angle-right { color: transparent; }
</style>
