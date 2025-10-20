<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="map-popup">
    <button type="button" class="close" :aria-label="$t('action.close')"
      @click="$emit('hide')">
      <span aria-hidden="true">&times;</span>
    </button>
    <div class="map-popup-title"><slot name="title"></slot></div>
    <div ref="body" class="map-popup-body"><slot name="body"></slot></div>
    <div class="map-popup-footer"><slot name="footer"></slot></div>
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue';

defineEmits(['hide']);

const body = useTemplateRef('body');
const resetScroll = () => { body.value.scrollTo(0, 0); };
defineExpose({ resetScroll });
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.map-popup {
  display: flex;
  flex-direction: column;

  position: absolute;
  top: 15px;
  left: 15px;

  width: 318px;
  max-height: 363px;

  background-color: $color-page-background;
  border-radius: 6px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
              0 1px 1px 0 rgba(0, 0, 0, 0.14),
              0 1px 3px 0 rgba(0, 0, 0, 0.12);

  padding-block: 21px;
  // Setting the inline padding not on .map-popup, but on its children, because
  // .map-popup-body needs to be the full width of the popup. That's so its
  // vertical scrollbar is all the way on the right.
  > div { padding-inline: $padding-panel-body; }

  > .close { @include modal-close; }
}

.map-popup-title, .map-popup-footer {
  flex-shrink: 0;

  &:empty { display: none; }
}

.map-popup-title {
  @include text-overflow-ellipsis;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.25;
  // Buffer between the title and the close button
  margin-right: 24px;
  padding-bottom: 21px;
}

.map-popup-body {
  overflow-y: auto;

  dl { margin-bottom: 0; }
  dd:not(.dl-data-dd) { @include text-overflow-ellipsis; }
}

.map-popup-footer { padding-top: 21px; }
</style>
