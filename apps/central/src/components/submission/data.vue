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
  <dl v-if="fields.dataExists && submission.dataExists" class="submission-data">
    <div v-for="field of fields.selectable" :key="field.path">
      <dl-data :value="field.binary !== true ? formatValue(submission.data, field, $i18n) : null">
        <template #name>
          <span v-if="field.path === mappedFieldPath" class="icon-check-circle mapped-field-icon"
            v-tooltip.sr-only></span>
          <span v-tooltip.no-aria="field.header" class="field-name">{{ field.name }}</span>
          <span v-if="field.path === mappedFieldPath" class="sr-only">&nbsp;{{ $t('mappedField') }}</span>
        </template>
        <template v-if="field.binary === true && getValue(submission.data, field) != null"
          #value>
          <submission-attachment-link :project-id="projectId"
            :xml-form-id="xmlFormId" :instance-id="instanceId"
            :attachment-name="getValue(submission.data, field)"/>
        </template>
      </dl-data>
    </div>
  </dl>
</template>

<script setup>
import DlData from '../dl-data.vue';
import SubmissionAttachmentLink from './attachment-link.vue';

import { getValue, formatValue } from '../../util/submission';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'SubmissionData'
});
defineProps({
  projectId: String,
  xmlFormId: String,
  instanceId: String,
  mappedFieldPath: String
});

const { fields, submission } = useRequestData();
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.submission-data {
  .mapped-field-icon {
    margin-right: 2px;
    color: $color-success;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.SubmissionMapPopup.mappedField
    // Message of the tooltip of checkmark icon, which is shown next of the fieldname that is used to plot pins on the map
    "mappedField": "Map references this field"
  }
}
</i18n>
