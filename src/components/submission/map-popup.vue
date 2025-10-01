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
  <map-popup v-show="submission.dataExists || submission.awaitingResponse"
    id="submission-map-popup" icon="file" @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <loading :state="submission.awaitingResponse"/>
      <dl v-if="submission.dataExists">
        <div>
          <dt>{{ $t('header.submitterName') }}</dt>
          <dd v-tooltip.text>{{ submission.__system.submitterName }}</dd>
        </div>
        <div>
          <dt>{{ $t('header.submissionDate') }}</dt>
          <dd><date-time :iso="submission.__system.submissionDate"/></dd>
        </div>
      </dl>
      <template v-if="fields.dataExists">
        <div v-if="missingField != null">
          <span class="icon-warning"></span>
          <i18n-t keypath="missingField">
            <template #field>
              <strong v-tooltip.no-aria="missingField.header">
                {{ missingField.name }}
              </strong>
            </template>
          </i18n-t>
        </div>
        <dl>
          <div v-for="field of orderedFields" :key="field.path">
            <dl-data :value="path(field.pathElements, submission.data)?.toString()">
              <template #name>
                <span v-tooltip.no-aria="field.header">{{ field.name }}</span>
              </template>
            </dl-data>
          </div>
        </dl>
      </template>
    </template>
  </map-popup>
</template>

<script setup>
import { computed, watch } from 'vue';
import { last, path } from 'ramda';

import DateTime from '../date-time.vue';
import DlData from '../dl-data.vue';
import Loading from '../loading.vue';
import MapPopup from '../map-popup.vue';

import useSubmission from '../../request-data/submission';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'SubmissionMapPopup'
});
const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  instanceId: String,
  fieldpath: String
});
defineEmits(['hide']);

const { fields } = useRequestData();
const { submission } = useSubmission();

const fetchData = () => submission.request({
  url: apiPaths.odataSubmission(
    props.projectId,
    props.xmlFormId,
    props.instanceId,
    { $wkt: true }
  )
}).catch(noop);
watch(
  () => props.instanceId,
  (instanceId) => {
    if (instanceId != null)
      fetchData();
    else
      submission.reset();
  },
  { immediate: true }
);

const fieldIndex = computed(() =>
  fields.selectable.findIndex(field => field.path === props.fieldpath));
const missingField = computed(() => {
  if (props.fieldpath == null || fieldIndex.value !== -1) return null;
  const elements = props.fieldpath.split('/');
  elements.shift();
  return { name: last(elements), header: elements.join('-') };
});
const orderedFields = computed(() => {
  if (props.fieldpath == null || fieldIndex.value === -1)
    return fields.selectable;
  const result = [...fields.selectable];
  result.unshift(...result.splice(fieldIndex.value, 1));
  return result;
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-map-popup {
  dl:first-of-type {
    padding-bottom: $padding-block-dl;
    border-bottom: $border-bottom-dl;
  }
  dl + div {
    padding-block: $padding-block-dl;
    border-bottom: $border-bottom-dl;
  }
  dl:last-of-type {
    padding-top: $padding-block-dl;
  }

  .icon-warning {
    color: $color-warning;
    margin-right: $margin-right-icon;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.SubmissionBasicDetails.submissionDetails
    "title": "Submission Details",
    // {field} is the name of a Form field.
    "missingField": "This Submission was mapped using {field}, which isn’t in the published Form version."
  }
}
</i18n>
