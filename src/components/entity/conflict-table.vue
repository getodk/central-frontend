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
    <p v-if="versions.length === 0" class="empty-table-message">
      {{ $t('noConflicts') }}
    </p>
    <table v-else ref="table" class="table">
      <thead>
        <tr>
          <th ref="firstHeader">{{ $t('common.version') }}</th>
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
// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();
const propertyNames = computed(() => {
  const result = [];
  const { allReceived } = summary.value;
  for (const { name } of dataset.properties) {
    if (allReceived.has(name)) result.push(name);
  }

  // Check for properties that are in allReceived but not dataset.properties.
  const expectedCount = allReceived.has('label')
    ? allReceived.size - 1
    : allReceived.size;
  if (result.length !== expectedCount) {
    const propertySet = new Set(dataset.properties);
    for (const name of allReceived) {
      if (name !== 'label' && !propertySet.has(name)) result.push(name);
    }
  }

  return result;
});

// Resize columns using a strategy similar to useColumnGrow().
const el = ref(null);
const table = ref(null);
const firstHeader = ref(null);
const versionHeaders = ref([]);
const minWidth = 50;
const maxWidth = 250;
const clampWidth = clamp(minWidth, maxWidth);
const resize = () => {
  if (props.versions.length === 0) return;
  const containerWidth = el.value.getBoundingClientRect().width;
  if (containerWidth === 0) return;

  // Undo previous resizing.
  firstHeader.value.style.width = '';
  for (const header of versionHeaders.value)
    header.style.width = '';

  // This makes the width of each column equal to its content width. After
  // getting those content widths and setting the new column widths, we will
  // remove this style.
  table.value.style.width = 'auto';

  // Resize the first column.
  const firstHeaderWidth = clampWidth(firstHeader.value.getBoundingClientRect().width);
  firstHeader.value.style.width = px(firstHeaderWidth);

  // Resize the version columns, giving each column the same width. Keep the
  // column width between the min width and the maximum content width, but
  // otherwise use the remaining width of the container.
  const maxVersionWidth = clampWidth(versionHeaders.value.reduce(
    (acc, header) => Math.max(acc, header.getBoundingClientRect().width),
    0
  ));
  const versionWidth = clamp(
    minWidth,
    maxVersionWidth,
    (containerWidth - firstHeaderWidth) / props.versions.length
  );
  const versionWidthPx = px(versionWidth);
  for (const header of versionHeaders.value)
    header.style.width = versionWidthPx;

  // Stretch the last column if there's leftover width in the container.
  if (containerWidth > firstHeaderWidth + props.versions.length * versionWidth) {
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

  th, td { @include text-overflow-ellipsis; }
  td { border-left: 1px solid #bbb; }

  tbody tr:nth-child(n + 2) {
    th, td {
      padding-bottom: 12px;
      padding-top: 12px;
    }
  }
  tbody tr:last-child {
    th, td { padding-bottom: 15px; }
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
  .icon-question-circle { color: $color-warning-dark; }
  .icon-warning { color: $color-danger-dark; }
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
      // the Entity that the author saw when they made their changes.
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
      "softConflict": "This version may have been made based on old data.",
      "hardConflict": "This version was made in parallel with other updates, some of which attempt to write to the same properties as this update."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noConflicts": "Nejsou žádné konflikty k zobrazení.",
    "source": {
      "label": "Zdroj",
      "description": "Aktualizace, která vygenerovala tuto verzi"
    },
    "status": {
      "historical": "Tato historická verze je zahrnuta, protože nedávná paralelní aktualizace byla provedena na základě této verze této Entity.",
      "lastGoodVersion": "Toto je nejnovější verze v dobré shodě. Po této aktualizaci byly provedeny potenciálně konfliktní aktualizace paralelně.",
      "hardConflict": "Tato verze byla vytvořena paralelně s dalšími aktualizacemi, z nichž některé se snaží zapisovat do stejných vlastností jako tato aktualizace."
    }
  },
  "fr": {
    "noConflicts": "Il n'y a pas de conflit à afficher.",
    "basedOn": {
      "label": "Basé sur",
      "description": "La version de cette Entité vue par les auteurs quand ils ont fait leurs changements."
    },
    "source": {
      "label": "Source",
      "description": "La mise à jour qui a généré cette version"
    },
    "status": {
      "historical": "Cette version historique est inclues parce qu'une récente mise à jour parallèle a été faite sur la base de cette version de l'Entité.",
      "lastGoodVersion": "Ceci est la version cohérente la plus récente. Après cette mise à jour, des mises à jour potentiellement contradictoires ont été effectuées en parallèle.",
      "softConflict": "Cette version pourrait avoir été faite sur la base d'une vieille donnée.",
      "hardConflict": "Cette version a été faite en parallèle avec d'autres, certaines tentent d'écrire les mêmes propriétés que cette mise à jour."
    }
  }
}
</i18n>
