<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="datasetDiff.dataExists && datasetDiff.length > 0">
    <template v-for="(dataset, index) in datasetDiff" :key="dataset.name">
      <!-- TODO replace it with expandable-row -->
      <dataset-summary-row :dataset="dataset"/>
      <hr v-if="index < datasetDiff.length - 1">
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import DatasetSummaryRow from './summary/row.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'DatasetSummary'
});
const props = defineProps({
  isDraft: Boolean
});

// The component does not assume that this data will exist when the component is
// created.
const { formDatasetDiff, formDraftDatasetDiff } = useRequestData();
const datasetDiff = computed(() =>
  (props.isDraft ? formDraftDatasetDiff : formDatasetDiff));
</script>
