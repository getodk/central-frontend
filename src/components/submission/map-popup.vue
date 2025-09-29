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
  <map-popup v-show="instanceId != null" icon="file" @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <loading :state="submission.awaitingResponse"/>
      <dl v-if="submission.dataExists">
        <div>
          <dt>{{ $t('header.submitterName') }}</dt>
          <dd>{{ submission.__system.submitterName }}</dd>
        </div>
        <div>
          <dt>{{ $t('header.submissionDate') }}</dt>
          <dd><date-time :iso="submission.__system.submissionDate"/></dd>
        </div>
        <div v-for="field of orderedFields" :key="field.path">
          <dl-data :value="path(field.pathElements, submission.data)?.toString()">
            <template #name>
              <span v-tooltip.no-aria="field.header">{{ field.name }}</span>
            </template>
          </dl-data>
        </div>
      </dl>
    </template>
  </map-popup>
</template>

<script setup>
import { computed, watch } from 'vue';
import { path } from 'ramda';

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
  ),
  alert: false
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

const orderedFields = computed(() => {
  const { selectable } = fields;
  const i = selectable.findIndex(field => field.path === props.fieldpath);
  // i can be -1 if props.fieldpath corresponds to a field that is not in the
  // current version of the form.
  if (i === -1) return selectable;

  const result = [...selectable];
  result.unshift(...result.splice(i, 1));
  return result;
});
</script>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.SubmissionBasicDetails.submissionDetails
    "title": "Submission Details"
  }
}
</i18n>
