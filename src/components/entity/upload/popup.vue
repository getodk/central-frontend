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
  <div id="entity-upload-popup">
    <div id="entity-upload-popup-heading">
      <div v-tooltip.text>{{ filename }}</div>
      <button v-show="!awaitingResponse" type="button" class="close"
        :aria-label="$t('action.clear')" @click="$emit('clear')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div id="entity-upload-popup-count">{{ $tcn('rowCount', count) }}</div>
    <div v-show="awaitingResponse" id="entity-upload-popup-status">
      <spinner :state="true" inline/><span>{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Spinner from '../../spinner.vue';

defineOptions({
  name: 'EntityUploadPopup'
});
const props = defineProps({
  filename: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  awaitingResponse: Boolean,
  progress: {
    type: Number,
    required: true
  }
});
defineEmits(['clear']);

const { t, n } = useI18n();
const status = computed(() => (props.progress < 1
  ? t('status.sending', { percentUploaded: n(props.progress, 'percent') })
  : t('status.processing')));
</script>

<style lang="scss">
@use 'sass:color';
@import '../../../assets/scss/mixins';

#entity-upload-popup {
  background-color: $color-subpanel-background;
  border: 2px solid $color-action-foreground;
  border-radius: 6px;
  outline: 5px solid #{color.change($color-action-foreground, $alpha: 0.15)};
  padding: 15px;
}

#entity-upload-popup-heading {
  align-items: baseline;
  display: flex;

  > div {
    @include text-overflow-ellipsis;
    font-size: 18px;
    font-weight: bold;
  }

  .close {
    flex-shrink: 0;
    margin-left: 6px;
    opacity: 0.5;

    &:hover, &:focus { opacity: 0.2; }
  }
}

#entity-upload-popup-status {
  margin-bottom: 5px;
  margin-top: 15px;

  .spinner + span {
    font-weight: bold;
    margin-left: 6px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "rowCount": "{count} data row found | {count} data rows found",
    "status": {
      // This text is shown while a file is being uploaded to the server.
      "sending": "Sending file… ({percentUploaded})",
      // This text is shown after a file has been uploaded to the server, but
      // before the server has finished processing it.
      "processing": "Processing file…"
    }
  }
}
</i18n>
