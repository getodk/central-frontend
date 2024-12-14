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
  <div class="qr-panel panel panel-default">
    <div class="panel-heading">
      <h1 class="panel-title"><slot name="title"></slot></h1>
      <span class="icon-mobile"></span>
    </div>
    <div class="panel-body">
      <slot name="body"></slot>
      <div v-if="showClose" class="panel-footer">
        <button type="button" class="btn btn-primary" data-closes-popover>{{ $t('action.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'QrPanel'
});
defineProps({
  showClose: {
    type: Boolean,
    default: true
  }
});
</script>

<style lang="scss">
@import '../assets/scss/variables';

.qr-panel {
  margin-bottom: 0;
  width: 505px;

  .panel-heading {
    background-color: $color-action-background;
    position: relative;
  }

  .panel-footer {
    margin-bottom: -15px;
    border-radius: 0;
  }

  // The icon is not animated, because in FieldKeyQrPanel, switching between a
  // managed and a legacy QR code would reset the animation.
  .icon-mobile {
    color: $color-action-overlay;
    font-size: 98px;
    position: absolute;
    right: 18px;
    top: -32px;
    transform: rotate(15deg);

    &::after {
      background-color: #fff;
      content: '';
      height: 65px;
      left: 5px;
      position: absolute;
      top: 18px;
      width: 32px;
      z-index: -1;
    }
  }

  .collect-qr {
    float: left;
    margin-right: 15px;
  }

  p {
    &:first-child { margin-top: 5px; }
    &:last-child { margin-bottom: 5px; }
  }
}
</style>
