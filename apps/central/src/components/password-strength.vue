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

<!-- Parts of this component are based on the npm package
vue-password-strength-meter 1.7.2, which uses the MIT license.
https://github.com/apertureless/vue-password-strength-meter -->
<template>
  <div class="password-strength">
    <div :data-score="score"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  password: {
    type: String,
    required: true
  }
});

const score = computed(() => {
  const { length } = props.password;
  if (length === 0) return 0;
  if (length < 8) return 1;
  if (length < 10) return 2;
  if (length < 12) return 3;
  if (length < 14) return 4;
  return 5;
});
</script>

<style lang="scss">
@use 'sass:color';
@use 'sass:math';
@import '../assets/scss/mixins';

.password-strength {
  background-color: #ddd;
  float: right;
  height: 2px;
  margin-bottom: 20px;
  margin-top: 10px;
  position: relative;
  width: 50%;

  // Use the borders of two pseduo-elements to create 4 blank spaces (gaps),
  // resulting in 5 bars.
  $between-bars: 5px;
  $bar-width: calc(20% - #{math.div(4 * $between-bars, 5)});
  &::before, &::after {
    background-color: transparent;
    border-color: #fff;
    border-style: solid;
    border-width: 0 $between-bars 0 $between-bars;
    box-sizing: content-box;
    content: '';
    display: block;
    height: 100%;
    position: absolute;
    top: 0;
    width: $bar-width;
    z-index: 1;
  }
  &::before { left: $bar-width; }
  &::after { right: $bar-width; }

  [data-score] {
    height: 100%;
    transition: width 0.5s ease-in-out, background-color 0.25s;
  }
  [data-score="0"] {
    width: 0;
  }
  [data-score="1"] {
    background-color: $color-danger;
    // 20% is somewhere between the two bars (it is greater than $bar-width and
    // less than $bar-width + $between-bars). But since the pseudo-elements have
    // a higher z-index, only $bar-width of the background color will be
    // visible (as desired).
    width: 20%;
  }
  [data-score="2"] {
    background-color: color.mix($color-danger, $color-warning);
    width: 40%;
  }
  [data-score="3"] {
    background-color: $color-warning;
    width: 60%;
  }
  [data-score="4"] {
    background-color: color.mix($color-warning, $color-success);
    width: 80%;
  }
  [data-score="5"] {
    background-color: $color-success;
    width: 100%;
  }
}
</style>
