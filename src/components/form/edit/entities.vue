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
  <form-edit-section id="form-edit-entities" icon="database">
    <template #title>{{ $t('resource.entities') }}</template>
    <template #subtitle>
      <template v-if="formDraftDatasetDiff.dataExists">
        {{ $tcn('datasetCount', formDraftDatasetDiff.length) }}
      </template>
      <p v-else-if="!formDraft.entityRelated">
        <span>{{ $t('notEntityRelated') }}</span>
        <sentence-separator/>
        <doc-link to="central-entities/">{{ $t('whatAreEntities') }}</doc-link>
      </p>
    </template>
    <template #body>
      <template v-if="formDraft.entityRelated">
        <loading :state="formDraftDatasetDiff.initiallyLoading"/>
        <dataset-summary is-draft/>
      </template>
    </template>
  </form-edit-section>
</template>

<script setup>
import DatasetSummary from '../../dataset/summary.vue';
import DocLink from '../../doc-link.vue';
import FormEditSection from './section.vue';
import Loading from '../../loading.vue';
import SentenceSeparator from '../../sentence-separator.vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'FormEditEntities'
});

const { formDraftDatasetDiff, resourceView } = useRequestData();
const formDraft = resourceView('formDraft', (data) => data.get());
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#form-edit-entities {
  .dataset-summary { margin-top: -$padding-top-expandable-row; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "datasetCount": "Publishing this draft will update {count} Entity List | Publishing this draft will update {count} Entity Lists",
    // "Definition" refers to a Form Definition.
    "notEntityRelated": "This definition does not update any Entities.",
    "whatAreEntities": "What are Entities?"
  }
}
</i18n>
