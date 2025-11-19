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
  <table class="entity-diff-table table">
    <colgroup>
      <col>
      <col>
      <col>
      <col>
    </colgroup>
    <thead class="sr-only">
      <tr>
        <th scope="col"></th>
        <th scope="col">{{ $t('header.oldValue') }}</th>
        <th scope="col" aria-hidden="true"></th>
        <th scope="col">{{ $t('header.newValue') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="entityVersion.conflict != null" class="comparing">
        <td>{{ $t('comparing') }}</td>
        <td>
          <i18n-t tag="div" keypath="version" class="version-and-source"
            v-tooltip.text>
            <template #version>
              <span class="version-string">{{ $t('common.versionShort', oldVersion) }}</span>
            </template>
            <template #source>
              <entity-version-link :uuid="uuid" :version="oldVersion"/>
            </template>
          </i18n-t>
        </td>
        <td aria-hidden="true"><span class="icon-arrow-circle-right"></span></td>
        <td>
          <i18n-t tag="div" keypath="version" class="version-and-source"
            v-tooltip.text>
            <template #version>
              <span class="version-string">{{ $t('common.versionShort', entityVersion) }}</span>
            </template>
            <template #source>
              <entity-version-link :uuid="uuid" :version="entityVersion"/>
            </template>
          </i18n-t>
          <div v-if="entityVersion.branch != null" class="offline-update">
            {{ $t('offlineUpdate') }}
          </div>
        </td>
      </tr>
      <tr v-if="showsAccuracyWarning" class="accuracy-warning">
        <td colspan="4">
          <p><span class="icon-warning"></span>{{ $t('accuracyWarning') }}</p>
        </td>
      </tr>
      <entity-diff-row v-for="name of diff" :key="name"
        :old-version="oldVersion" :name="name"/>
    </tbody>
  </table>
</template>

<script setup>
import { computed, inject, toRaw } from 'vue';

import EntityDiffRow from './row.vue';
import EntityVersionLink from '../version-link.vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityDiffTable'
});
const props = defineProps({
  diff: {
    type: Set,
    required: true
  }
});
const uuid = inject('uuid');
const entityVersion = inject('entityVersion');

// The component assumes that this data will exist when the component is
// created.
const { entityVersions } = useRequestData();
const oldVersion = computed(() => {
  // toRaw() isn't needed in production, but it is needed in testing for some
  // reason.
  const oldVersionNumber = toRaw(props.diff) === entityVersion.baseDiff
    ? entityVersion.baseVersion
    : entityVersion.version - 1;
  return entityVersions[oldVersionNumber - 1];
});

const showsAccuracyWarning = computed(() =>
  // serverDiff is always accurate.
  props.diff === entityVersion.baseDiff &&
  // If there's no conflict, then there's really only one diff: baseDiff has the
  // same meaning as serverDiff.
  entityVersion.conflict != null &&
  // There's only an issue with offline updates.
  entityVersion.branch != null &&
  // There's never an issue with the first version from the branch.
  entityVersion !== entityVersion.branch.first &&
  /* If the branch stopped being contiguous with the trunk version sometime
  before the base version, that means that the base version incorporates an
  update from outside the branch. In that case, baseDiff may differ from the
  true author's view. It's OK if there was an update from outside the branch
  between the base version and this version, but it's not OK if there was such
  an update between the trunk version and the base version. */
  entityVersion.branch.lastContiguousWithTrunk < entityVersion.baseVersion);
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-diff-table {
  margin-bottom: 0;
  table-layout: fixed;

  tbody tr td {
    padding-bottom: 12px;
    padding-top: 12px;

    &:nth-child(3) {
      padding-left: 0;
      padding-right: 0;
    }
  }

  tr:first-child td { border-top: none; }

  .comparing {
    td:first-child, .version-string { font-weight: bold; }
  }
  .version-and-source { @include text-overflow-ellipsis; }
  .offline-update {
    @include italic;
    color: #888;
    font-size: 12px;
    margin-bottom: -3px;
  }

  td:nth-child(3) { text-align: center; }
  .icon-arrow-circle-right { color: #888; }

  .accuracy-warning {
    p {
      @include italic;
      margin-bottom: -2px;
      margin-top: -2px;
    }

    .icon-warning {
      color: $color-warning;
      margin-right: $margin-right-icon;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      // The value of an Entity property in an older version of the Entity
      "oldValue": "Old value",
      // The value of an Entity property in a newer version of the Entity
      "newValue": "New value"
    },
    // This is shown when Central displays a comparison of two versions of an
    // Entity.
    "comparing": "Comparing",
    // {version} is a short identifier of an Entity version, for example, "v3".
    // {source} indicates what created the Entity version, for example,
    // "Update by Alice".
    "version": "{version} ({source})",
    // @transifexKey component.EntityFeedEntry.offlineUpdate
    "offlineUpdate": "Offline update",
    // The author's view is a comparison between two versions of an Entity, from
    // the point of view of the data collector (the author).
    "accuracyWarning": "In this case, the author’s view may not be accurate."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "header": {
      "oldValue": "Stará hodnota",
      "newValue": "Nová hodnota"
    },
    "comparing": "Srovnání",
    "version": "{version} ({source})"
  },
  "de": {
    "header": {
      "oldValue": "Alter Wert",
      "newValue": "Neuer Wert"
    },
    "comparing": "Vergleichen",
    "version": "{version} ({source})",
    "accuracyWarning": "In diesem Fall ist die Ansicht des Autors möglicherweise nicht korrekt.",
    "offlineUpdate": "Offline-Aktualisierung"
  },
  "es": {
    "header": {
      "oldValue": "Valor antiguo",
      "newValue": "Nuevo valor"
    },
    "comparing": "Comparando",
    "version": "{version} ({source})",
    "accuracyWarning": "En este caso, la opinión del autor puede no ser exacta.",
    "offlineUpdate": "Actualización offline"
  },
  "fr": {
    "header": {
      "oldValue": "Ancienne valeur",
      "newValue": "Nouvelle valeur"
    },
    "comparing": "Comparaison",
    "version": "{version} ({source})",
    "accuracyWarning": "Dans ce cas, la vue de l'auteur peut ne pas être exacte.",
    "offlineUpdate": "Mise à jour Hors Ligne"
  },
  "it": {
    "header": {
      "oldValue": "Vecchio valore",
      "newValue": "Nuovo valore"
    },
    "comparing": "Paragonando",
    "version": "{version} ({source})",
    "accuracyWarning": "In questo caso, l'opinione dell'autore potrebbe non essere accurata.",
    "offlineUpdate": "Aggiornamento offline"
  },
  "pt": {
    "header": {
      "oldValue": "Valor antigo",
      "newValue": "Novo valor"
    },
    "comparing": "Comparando",
    "version": "{version} {source}",
    "accuracyWarning": "Nesse caso, a visualização do autor pode não ser precisa.",
    "offlineUpdate": "Atualização offline"
  },
  "zh": {
    "header": {
      "oldValue": "原值",
      "newValue": "新值"
    },
    "comparing": "正在比对",
    "version": "{version}（{source}）",
    "accuracyWarning": "此种情况下，提交者视图可能不准确。",
    "offlineUpdate": "离线更新"
  },
  "zh-Hant": {
    "header": {
      "oldValue": "舊值",
      "newValue": "新值"
    },
    "comparing": "比較",
    "version": "{version} ({source})",
    "accuracyWarning": "在這種情況下，作者的觀點可能並不準確。",
    "offlineUpdate": "離線更新"
  }
}
</i18n>
