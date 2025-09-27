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
  <dl id="submission-map-popup" class="dl-horizontal">
    <dt>{{ $t('title') }}</dt>
    <dd></dd>

    <dt>{{ $t('header.instanceId') }}</dt>
    <dd v-tooltip.text>{{ instanceId }}</dd>

    <dt v-tooltip.text>{{ fieldName }}</dt>
    <dd v-tooltip.text>
      <selectable><pre><code>{{ coordinateJson }}</code></pre></selectable>
    </dd>
  </dl>
</template>

<script setup>
import { computed } from 'vue';
import { last } from 'ramda';

import Selectable from '../selectable.vue';

defineOptions({
  name: 'SubmissionMapPopup'
});
const props = defineProps({
  instanceId: {
    type: String,
    required: true
  },
  fieldpath: {
    type: String,
    required: true
  },
  coordinates: {
    type: Array,
    required: true
  }
});

const coordinateJson = computed(() => JSON.stringify(props.coordinates, null, 2));
const fieldName = computed(() => last(props.fieldpath.split('/')));
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-map-popup {
  position: absolute;
  top: 10px;
  right: 10px;

  background-color: #fff;
  max-width: 500px;
  padding-block: $padding-block-dl;

  dt, dd { @include text-overflow-ellipsis; }

  pre {
    background-color: transparent;
    border: none;
    margin-bottom: 0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.SubmissionBasicDetails.submissionDetails
    "title": "Submission Details"
  }
}
</i18n>
