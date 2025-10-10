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
    id="submission-map-popup" @hide="$emit('hide')">
    <template v-if="submission.dataExists" #title>
      <submission-review-state :value="submission.__system.reviewState" tooltip/>
      <span>{{ submission.instanceName ?? $t('submissionDetails') }}</span>
    </template>
    <template #body>
      <loading :state="submission.awaitingResponse"/>
      <div v-if="fields.dataExists" v-show="submission.dataExists">
        <dl>
          <div>
            <dt>{{ $t('header.submitterName') }}</dt>
            <dd v-tooltip.text>{{ submission?.__system?.submitterName }}</dd>
          </div>
          <div>
            <dt>{{ $t('header.submissionDate') }}</dt>
            <dd><date-time :iso="submission?.__system?.submissionDate"/></dd>
          </div>
        </dl>
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
      </div>
    </template>
    <template #footer>
      <submission-actions v-if="submission.dataExists"
        :submission="submission.data" :awaiting-response="awaitingResponse"
        @click="handleActions"/>
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
import SubmissionActions from './actions.vue';
import SubmissionReviewState from './review-state.vue';

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
  fieldpath: String,
  awaitingResponse: Boolean
});
const emit = defineEmits(['hide', 'review', 'delete']);

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

const handleActions = (event) => {
  const action = event.target.closest('.btn-group .btn');
  if (action == null) return;
  const { classList } = action;
  if (classList.contains('review-button'))
    emit('review', submission.data);
  else if (classList.contains('delete-button'))
    emit('delete', submission.data);
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-map-popup {
  @include icon-btn-group;

  .submission-review-state {
    position: relative;
    top: -1px;

    font-size: 14px;
  }

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
    "submissionDetails": "Submission Details",
    // {field} is the name of a Form field.
    "missingField": "This Submission was mapped using {field}, which isn’t in the published Form version."
  }
}
</i18n>
