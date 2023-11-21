<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="entity-conflict-table" ref="el">
    <p v-if="versions.length === 0">{{ $t('noConflicts') }}</p>
    <table v-else ref="table" class="table">
      <thead>
        <tr>
          <th ref="labelHeader">{{ $t('common.version') }}</th>
          <th v-for="version of versions" ref="versionHeaders"
            :key="version.version">
            {{ $t('common.versionShort', version) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>
            <span class="dfn" v-tooltip.sr-only>{{ $t('basedOn.label') }}</span>
            <span class="sr-only">&nbsp;{{ $t('basedOn.description') }}</span>
          </th>
          <td v-for="{ version, baseVersion } of versions" :key="version">
            {{ baseVersion == null ? '' : $t('common.versionShort', { version: baseVersion }) }}
          </td>
        </tr>
        <tr>
          <th>
            <span class="dfn" v-tooltip.sr-only>{{ $t('source.label') }}</span>
            <span class="sr-only">&nbsp;{{ $t('source.description') }}</span>
          </th>
          <td v-for="version of versions" :key="version.version" v-tooltip.text>
            <entity-version-link :uuid="uuid" :version="version"
              :target="linkTarget"/>
          </td>
        </tr>
        <tr v-if="summary.allReceived.has('label')">
          <th class="label-header">{{ $t('entity.label') }}</th>
          <td v-for="{ version, label, baseDiff } of versions" :key="version"
            :class="version === 1 || baseDiff.has('label') ? null : 'unchanged'"
            v-tooltip.text>
            {{ label }}
          </td>
        </tr>
        <tr v-for="name of propertyNames" :key="name">
          <th class="property-name" v-tooltip.text>{{ name }}</th>
          <td v-for="{ version, data, baseDiff } of versions" :key="version"
            :class="version === 1 || baseDiff.has(name) ? null : 'unchanged'"
            v-tooltip.text>
            {{ data[name] }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('common.status') }}</th>
          <td v-for="version of versions" :key="version.version">
            <template v-if="version.version < lastGoodVersion">
              <span class="icon-history" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.historical') }}</span>
            </template>
            <template v-else-if="version.lastGoodVersion">
              <span class="icon-check-circle" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.lastGoodVersion') }}</span>
            </template>
            <template v-else-if="version.conflict === 'soft'">
              <span class="icon-question-circle" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.softConflict') }}</span>
            </template>
            <template v-else-if="version.conflict === 'hard'">
              <span class="icon-warning" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.hardConflict') }}</span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { clamp, last } from 'ramda';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import EntityVersionLink from './version-link.vue';

import { px } from '../../util/dom';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityConflictTable'
});
const props = defineProps({
  uuid: {
    type: String,
    required: true
  },
  versions: {
    type: Array,
    required: true
  },
  linkTarget: String
});

// Iterate over all versions just once.
const summary = computed(() => {
  let lastGoodVersion;
  // The keys of dataReceived from each unresolved conflict
  const allReceived = new Set();
  for (const version of props.versions) {
    if (version.lastGoodVersion) lastGoodVersion = version.version;

    if (version.conflict != null && !version.resolved) {
      for (const name of Object.keys(version.dataReceived))
        allReceived.add(name);
    }
  }
  return { lastGoodVersion, allReceived };
});
const lastGoodVersion = computed(() => summary.value.lastGoodVersion);

// Property names
// The component does not assume that this data will exist when the component is
// created.
const { dataset } = useRequestData();
const propertyNames = computed(() => {
  const result = [];
  if (!dataset.dataExists) return result;
  const { allReceived } = summary.value;
  for (const { name } of dataset.properties) {
    if (allReceived.has(name)) result.push(name);
  }
  return result;
});

// Resize columns using a strategy similar to useColumnGrow().
const el = ref(null);
const table = ref(null);
const labelHeader = ref(null);
const versionHeaders = ref([]);
const minWidth = 50;
const maxWidth = 250;
const clampWidth = clamp(minWidth, maxWidth);
const resize = () => {
  if (table.value == null) return;
  const containerWidth = el.value.getBoundingClientRect().width;
  if (containerWidth === 0) return;

  // Undo previous resizing.
  labelHeader.value.style.width = '';
  for (const header of versionHeaders.value)
    header.style.width = '';
  table.value.style.width = 'auto';

  // Resize the label column.
  const labelHeaderWidth = clampWidth(labelHeader.value.getBoundingClientRect().width);
  labelHeader.value.style.width = px(labelHeaderWidth);

  // Resize the version columns. Keep the column width between the min width and
  // the maximum content width, but otherwise use the remaining width of the
  // container.
  const maxVersionWidth = clampWidth(versionHeaders.value.reduce(
    (acc, header) => Math.max(acc, header.getBoundingClientRect().width),
    0
  ));
  const versionWidth = clamp(
    minWidth,
    maxVersionWidth,
    (containerWidth - labelHeaderWidth) / props.versions.length
  );
  const versionWidthPx = px(versionWidth);
  for (const header of versionHeaders.value)
    header.style.width = versionWidthPx;

  // Stretch the last column if there's still space.
  if (containerWidth > labelHeaderWidth + props.versions.length * versionWidth) {
    table.value.style.width = '100%';
    last(versionHeaders.value).style.width = '';
  } else {
    table.value.style.width = '';
  }
};
onMounted(() => {
  resize();
  window.addEventListener('resize', resize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
});
defineExpose({ resize });
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-conflict-table {
  overflow-x: auto;

  p, table { margin-bottom: 0; }

  table { table-layout: fixed; }

  thead th { font-size: 14px; }
  th:first-child { text-align: right; }

  tbody tr {
    background-color: $background-color-feed-entry;
    &:first-child, &:nth-child(2), &:last-child { background-color: #f4f4f4; }
  }

  tbody th, td { @include text-overflow-ellipsis; }
  td { border-left: 1px solid #bbb; }

  tbody tr:nth-child(n + 2) {
    th, td {
      padding-bottom: 12px;
      padding-top: 12px;
    }
  }

  .label-header, .property-name {
    color: $color-danger;
    font-weight: normal;
  }
  .property-name { font-family: $font-family-monospace; }

  .unchanged {
    color: #888;
    font-style: italic;
  }

  [class^="icon-"] {
    font-size: 16px;
    vertical-align: -2px;
  }
  .icon-history { color: #888; }
  .icon-check-circle { color: $color-success; }
  .icon-warning { color: $color-danger-dark; }
  .icon-question-circle { color: $color-warning-dark; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is shown if all conflicts between versions have been resolved for an
    // Entity.
    "noConflicts": "There are no conflicts to show.",
    "basedOn": {
      // "Based on" as in "the version of the Entity that this version is based
      // on". That version is known as the "base version". It is the version of
      // the Entity that the data collector saw when they made their changes.
      "label": "Based on",
      "description": "The version of this Entity that the author saw when they made their changes"
    },
    "source": {
      "label": "Source",
      "description": "The update that generated this version"
    },
    "status": {
      "historical": "This historical version is included because a recent parallel update was made based on this version of this Entity.",
      "lastGoodVersion": "This is the most recent version in good agreement. After this update, potentially conflicting updates have been made in parallel.",
      "softConflict": "This version was made in parallel with others, but it doesn’t write any properties touched by the parallel updates before it.",
      "hardConflict": "This version was made in parallel with other updates, some of which attempt to write to the same properties as this update."
    }
  }
}
</i18n>
