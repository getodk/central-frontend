<!--
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="datasets.dataExists && datasets.length > 0" id="dataset-trash-table">
    <details :open="!isDatasetTrashCollapsed" @toggle="onToggleTrashExpansion">
      <summary>
        <div class="trash-list-header">
          <span class="trash-list-title">
            <span :class="{ 'icon-chevron-right': isDatasetTrashCollapsed, 'icon-chevron-down': !isDatasetTrashCollapsed }" class="trash-expander"></span>
            <span class="icon-trash"></span>
            <span>{{ $t('common.trash') }}</span>
          </span>
          <span class="trash-list-count">{{ $t('trashCount', { count: $n(datasets.length, 'default') }) }}</span>
          <span class="trash-list-note">{{ $t('message') }}</span>
        </div>
      </summary>
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('header.listName') }}</th>
            <th class="entities">{{ $t('header.entities') }}</th>
            <th>{{ $t('header.lastEntity') }}</th>
            <th>{{ $t('deletedAt') }}</th>
            <th>{{ $t('header.actions') }}</th>
          </tr>
        </thead>
        <tbody v-if="datasets.dataExists">
          <dataset-trash-row v-for="dataset of datasets" :key="dataset.id" :dataset="dataset"/>
        </tbody>
      </table>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DatasetTrashRow from './trash-row.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'DatasetTrashTable'
});

// The component does not assume that this data will exist when the component is
// created.
const { deletedDatasets: datasets, currentUser, project } = useRequestData();

const isDatasetTrashCollapsed = computed(() => currentUser.preferences.projects[project.id].datasetTrashCollapsed);
const onToggleTrashExpansion = (evt) => {
  const projProps = currentUser.preferences.projects[project.id];
  if (evt.newState === 'closed') projProps.datasetTrashCollapsed = true;
  else if (projProps.datasetTrashCollapsed) projProps.datasetTrashCollapsed = false;
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#dataset-trash-table {
  table {
    table-layout: fixed;
  }

  .entities {
    text-align: right;
    padding-right: 10%;
  }

  &+.empty-table-message {
    margin-bottom: 20px;
  }

  .trash-list-header {
    display: flex;
    align-items: center;
    cursor: pointer;

    .trash-expander {
      display: inline-block;
      width: 1em;
      margin-right: 15px;
      font-size: 12px;
    }

    .icon-trash {
      padding-right: 8px;
    }

    .trash-count {
      font-weight: normal;
      color: black;
    }

    .trash-list-title {
      font-size: 26px;
      font-weight: 700;
      color: $color-danger;
      display: flex;
      align-items: center;
    }

    .trash-list-count {
      font-size: 20px;
      color: #888;
      padding-left: 4px;
    }

    .trash-list-note {
      margin-left: auto;
      color: #888
    }
  }

  // Hides default chevron in safari
  summary::-webkit-details-marker {
    display: none;
  }

}
</style>

<i18n lang="json5">
  {
    "en": {
      // @transifexKey component.EntityTable.header.deletedAt
      "deletedAt": "Deleted at",
      // {count} is the number of Entity Lists in the trash.
      "trashCount": "({count})",
      "message": "Entity Lists are deleted after 30 days in the Trash"
    }
  }
</i18n>
