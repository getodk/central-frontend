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
    <div class="map-popup-heading">
      <span :class="`icon-${icon}`"></span>
      <span class="map-popup-title"><slot name="title"></slot></span>
      <button type="button" class="close" :aria-label="$t('action.close')"
        @click="$emit('hide')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div ref="body" class="map-popup-body"><slot name="body"></slot></div>
    <div class="map-popup-footer"><slot name="footer"></slot></div>
  </div>
</template>

<script setup>
import { onBeforeUpdate, useTemplateRef } from 'vue';

defineProps({
  icon: {
    type: String,
    required: true
  }
});
defineEmits(['hide']);

const body = useTemplateRef('body');
onBeforeUpdate(() => { body.value.scrollTo(0, 0); });
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.map-popup {
  display: flex;
  flex-direction: column;

  position: absolute;
  top: 15px;
  right: 15px;

  width: 315px;
  max-height: 315px;

  background-color: $color-page-background;
  border-radius: 6px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
              0 1px 1px 0 rgba(0, 0, 0, 0.14),
              0 1px 3px 0 rgba(0, 0, 0, 0.12);

  padding-block: $padding-panel-body;
  // Setting the inline padding on the children rather than the root element,
  // because .map-popup-body needs to be the full width of the popup. That's so
  // its vertical scrollbar is all the way on the right.
  > div { padding-inline: $padding-panel-body; }
}

.map-popup-heading, .map-popup-footer { flex-shrink: 0; }

.map-popup-heading {
  color: $color-accent-primary;
  font-size: 20px;
  padding-bottom: 12px;

  > [class^="icon-"] {
    @include icon-box;
    font-size: 16px;
    margin-right: $margin-right-icon;
  }

  .close { @include modal-close; }
}

.map-popup-title {
  font-weight: 600;
  // Buffer between the title and the close button
  margin-right: 12px;
}

.map-popup-body {
  overflow-y: auto;

  dl { margin-bottom: 0; }
  dd:not(.dl-data-dd) { @include text-overflow-ellipsis; }
}

.map-popup-footer { padding-top: 15px; }
</style>
