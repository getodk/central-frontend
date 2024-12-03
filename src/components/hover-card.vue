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
  <div class="hover-card">
    <div class="hover-card-heading">
      <span :class="`icon-${icon}`"></span>
      <div>
        <div class="hover-card-title"><slot name="title"></slot></div>
        <div class="hover-card-subtitle"><slot name="subtitle"></slot></div>
      </div>
    </div>
    <div class="hover-card-body"><slot name="body"></slot></div>
    <div class="hover-card-footer"><slot name="footer"></slot></div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'HoverCard'
});
defineProps({
  icon: {
    type: String,
    required: true
  }
});
</script>

<style lang="scss">
@import '../assets/scss/mixins';

$border: 1px solid #fff;
$border-radius: 15px;

.popover:has(.hover-card) { border-radius: $border-radius; }
.hover-card { width: 290px; }

.hover-card-heading {
  background-color: #666;
  border-inline: $border;
  border-top: $border;
  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;
  color: #fff;
  display: flex;
  line-height: 1;
  padding: $padding-hover-card;

  span {
    font-size: 24px;
    flex-shrink: 0;
    margin-right: 10px;
  }
}

.hover-card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 3px;
}

.hover-card-subtitle { font-size: 12px; }

.hover-card-body {
  background-color: #fff;
  border-inline: $border;

  dl { margin-bottom: 0; }
  dt, dd:not(.dl-data-dd) { @include text-overflow-ellipsis; }
  dt { padding-left: $padding-hover-card; }
  dd { padding-right: $padding-hover-card; }
}

.hover-card-footer {
  background-color: #ddd;
  border-inline: $border;
  padding-inline: $padding-hover-card;

  &:empty { display: none; }
}

.hover-card-footer, .hover-card:has(.hover-card-footer:empty) .hover-card-body {
  border-bottom: $border;
  border-bottom-left-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
}
</style>
