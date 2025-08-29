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
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="subheader">
          <slot name="subheader"></slot>
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
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.home-summary-item {
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  border: 1px solid #E3E4E4;
  flex: 1 1 0px;

  .heading {
    align-items: center;
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    > [class^="icon-"] {
      @include icon-box;
      font-size: 24px;
    }
  }

  .header {
    font-size: 16px;
    margin-bottom: 0;
    line-height: 1;
    font-weight: 600;
  }

  .body {
    font-size: 12px;
    line-height: 16px;
    margin-bottom: 0;
  }
}
</style>
