<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- `Spinner` toggles a spinner according to its `state` prop. `Spinner` is
positioned absolutely, so you may need to set the position of an ancestor
element. -->
<template>
  <div :class="{ spinner: true, active: state }">
    <div class="spinner-glyph"></div>
  </div>
</template>

<script>
export default {
  name: 'Spinner',
  props: {
    state: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss">
@use 'sass:math';
@import '../assets/scss/variables';

$spinner-size: 16px;
$spinner-width: 3px;

@keyframes spin {
  from { transform: rotateZ(0deg); }
  to { transform: rotateZ(360deg); }
}

.spinner {
  $adjusted-position: calc(50% - #{math.div($spinner-size, 2)});
  display: block;
  left: $adjusted-position;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: $adjusted-position;
  transition: 0.3s opacity;

  &.active {
    animation-duration: 0.6s;
    animation-iteration-count: infinite;
    animation-name: spin;
    animation-timing-function: linear;
    opacity: 1;
    transition-delay: 0.15s;
  }
}
.spinner-glyph {
  height: $spinner-size;
  width: $spinner-size;

  &:before {
    border: $spinner-width solid #666;
    border-radius: 999px;
    content: '';
    display: block;
    height: $spinner-size;
    width: $spinner-size;

    .btn-primary &, .btn-danger & {
      border-color: #fff;
    }

    .btn-primary & {
      box-shadow: 0 0 20px 10px $color-action-background-disabled,
                  0 0 6px 3px $color-action-background-disabled inset;
    }

    .btn-danger & {
      box-shadow: 0 0 20px 10px $color-danger,
                  0 0 6px 3px $color-danger inset;
    }
  }

  &:after {
    border: 2px solid transparent;
    border-radius: 50%;
    border-right-color: $color-page-background;
    border-top-color: $color-page-background;
    content: '';
    display: block;
    left: math.div($spinner-size, 2) - math.div($spinner-width, 2);
    height: $spinner-width;
    position: absolute;
    top: 0;
    transform: rotate(45deg);
    width: $spinner-width;

    .btn-primary & {
      border-right-color: $color-action-background-disabled;
      border-top-color: $color-action-background-disabled;
    }

    .btn-danger & {
      border-right-color: $color-danger;
      border-top-color: $color-danger;
    }
  }
}
</style>
