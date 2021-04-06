<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="page-back" class="row">
    <div class="col-xs-12">
      <div>
        <span id="page-back-title">
          <router-link v-if="linkTitle" :to="to">
            <slot name="title"></slot>
          </router-link>
          <template v-else>
            <slot name="title"></slot>
          </template>
        </span>
        <router-link id="page-back-back" :to="to">
          <slot name="back"></slot>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageBack',
  props: {
    to: {
      type: String,
      required: true
    },
    linkTitle: Boolean
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#page-back {
  .col-xs-12 div {
    $background-color: #ddd;
    background-color: $background-color;
    border-bottom: 2px solid $color-subpanel-background;
    font-size: 18px;
    margin: 0 -15px;
    padding: 15px;
    position: relative;

    &::after {
      $height: 12px;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: $height solid $background-color;
      bottom: -$height;
      content: '';
      height: 0;
      left: 15px;
      position: absolute;
      width: 0;
    }
  }
}

#page-back-title {
  font-weight: bold;
  margin-right: 10px;

  a { @include text-link; }
}

#page-back-back { font-size: 12px; }
</style>
