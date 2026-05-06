<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr :class="htmlClass">
    <template v-if="submission.__system.status == null">
      <td v-for="field of fields" :key="field.path" :class="fieldClass(field)">
        <template v-if="field.binary === true">
          <submission-attachment-link v-if="getValue(submission, field) != null"
            :project-id="projectId" :xml-form-id="xmlFormId" :draft="draft"
            :instance-id="submission.__id"
            :attachment-name="getValue(submission, field)" :deleted="deleted"/>
        </template>
        <template v-else-if="needsTooltip(field.type)">
          <span v-tooltip.text>{{ formatValue(submission, field, $i18n) }}</span>
        </template>
        <template v-else>{{ formatValue(submission, field, $i18n) }}</template>
      </td>
    </template>
    <template v-else-if="fields.length !== 0">
      <td class="encrypted-data" :colspan="fields.length">
        <span class="icon-lock"></span>
        <span class="encryption-message">{{ $t('submission.encryptionMessage') }}</span>
        <span class="encryption-overlay"></span>
      </td>
    </template>
    <td>{{ submission.__id }}</td>
  </tr>
</template>

<script>
/*
We may render many rows and/or many columns, so performance matters in this
component. SubmissionDataRow components may be frequently created or unmounted,
so it matters how long it takes to render a component and how long it takes to
unmount one. (Note that unmounting may take longer than rendering!)

We used to have a SubmissionCell component, but that was too slow: now almost
everything is done in this component. We also used to have an i18n custom block,
but that again was significantly slower.
*/

const fieldClass = (field) => {
  // A field could have a `binary` property that is `true` but a `type` property
  // that does not equal 'binary'. Backend treats the `binary` property as
  // authoritative.
  if (field.binary === true) return 'binary-field';
  if (field.type === 'int') return 'int-field';
  if (field.type === 'decimal') return 'decimal-field';
  if (field.type === 'geopoint') return 'geopoint-field';
  return null;
};

const typesWithoutTooltips = ['int', 'decimal', 'date', 'time', 'dateTime', 'geopoint'];
const needsTooltip = (type) => !typesWithoutTooltips.includes(type);
</script>

<script setup>
import { computed } from 'vue';

import SubmissionAttachmentLink from './attachment-link.vue';

import { getValue, formatValue } from '../../util/submission';

defineOptions({
  name: 'SubmissionDataRow'
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
  draft: Boolean,
  submission: {
    type: Object,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
});

const htmlClass = computed(() =>
  ({ 'encrypted-submission': props.submission.__system.status != null }));
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-table {
  .int-field, .decimal-field { text-align: right; }

  // Geopoint width should always have enough room to show full data.
  // This neeeds an extra CSS selector to not be overwritten by
  // max-width:250px in submission/table.vue
  .table-freeze-scrolling .geopoint-field { max-width: 500px; }

  .binary-field { text-align: center; }

  .encrypted-submission {
    $icon-lock-margin-left: 3px;
    $icon-lock-margin-right: 12px;
    .icon-lock {
      font-size: 16px;
      color: #666;
      margin-left: $icon-lock-margin-left;
      margin-right: $icon-lock-margin-right;
      vertical-align: -2px;
    }

    .encryption-message { @include italic; }

    ~ .encrypted-submission {
      .encrypted-data { position: relative; }
      .encryption-message { display: none; }

      .encryption-overlay {
        background-color: #ddd;
        display: inline-block;
        height: 12px;
        position: absolute;
        // Adding 4px in order to vertically center the overlay.
        top: $padding-top-table-data + 4px;
        // 12px is the width of the .icon-lock (plus a pixel or two for good
        // measure).
        width: calc(100% - #{$padding-left-table-data + $icon-lock-margin-left} -
          12px - #{$icon-lock-margin-right + $padding-right-table-data});
      }
    }
  }
}
</style>
