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
  <div class="feed-entry">
    <div class="feed-entry-heading">
      <date-time :iso="iso"/>
      <div class="feed-entry-title" :class="{ truncate: !wrapTitle }">
        <slot name="title"></slot>
      </div>
    </div>
    <div class="feed-entry-body"><slot name="body"></slot></div>
  </div>
</template>

<script setup>
import DateTime from './date-time.vue';

defineProps({
  iso: {
    type: String,
    required: true
  },
  wrapTitle: Boolean
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.feed-entry {
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.feed-entry-heading, .feed-entry-body .markdown-view { padding: 10px 15px; }

.feed-entry-heading {
  background-color: #fff;

  time {
    float: right;
    font-size: 13px;
    color: #666;
    line-height: 25px;
  }
}

.feed-entry-title {
  $padding-left: 25px;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: -0.02em;
  overflow-wrap: break-word;
  padding-left: $padding-left;
  text-indent: -$padding-left;
  width: 70%;

  &.truncate { @include text-overflow-ellipsis; }

  // 18px (width) + 7px (margin-right) = $padding-left
  [class^="icon-"] {
    display: inline-block;
    margin-right: 7px;
    text-align: center;
    text-indent: 0;
    width: 18px;
  }

  a { font-weight: normal; }
}

.feed-entry-body {
  background-color: #f9f9f9;

  .markdown-view > p:last-child { margin: 0 0 0px; }
}
</style>
