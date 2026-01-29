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
  <table v-if="datasets.dataExists && datasets.length > 0" id="dataset-trash-table" class="table">
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
      <dataset-trash-row v-for="dataset of datasets" :key="dataset.id"
        :dataset="dataset"/>
    </tbody>
  </table>
</template>

<script setup>
import DatasetTrashRow from './trash-row.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'DatasetTrashTable'
});

// The component does not assume that this data will exist when the component is
// created.
const { deletedDatasets: datasets } = useRequestData();
</script>

<style lang="scss">
#dataset-trash-table {
  table-layout: fixed;

  .entities {
    text-align: right;
    padding-right: 10%;
  }

  &+ .empty-table-message {
    margin-bottom: 20px;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      // @transifexKey component.EntityTable.header.deletedAt
      "deletedAt": "Deleted at"
    }
  }
</i18n>
