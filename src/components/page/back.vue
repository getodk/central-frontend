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
          <router-link v-if="toArray[0] != null" :to="toArray[0]">
            <slot name="title"></slot>
          </router-link>
          <template v-else>
            <slot name="title"></slot>
          </template>
        </span>
        <span class="arrow"></span>
        <router-link id="page-back-back" :to="toArray[1]">
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
      type: [String, Array],
      required: true
    }
  },
  computed: {
    toArray() {
      return Array.isArray(this.to) ? this.to : [null, this.to];
    }
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

  span.arrow {
    display: inline-block;
    width: 25px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    margin-top: -15px;
    position: absolute;
    height: 100%;

    &:before {
      content: '';
      border: 1px solid #999;
      height: 32px;
      width: 30px;
      display: block;
      margin: 0;
      padding: 0;
      position: relative;
      transform: scaleY(1.8) rotate(45deg);
      right: 20px;
      top: 13px;
      box-shadow: 1px -1px 2px rgba(0,0,0,0.15), 0 0 8px rgba(0,0,0,0.1);
    }
  }

}

#page-back-title {
  font-weight: bold;
  margin-right: 10px;

  a { @include text-link; }
}

#page-back-back {
  font-size: 16px;
  margin-left: 30px
}
</style>
