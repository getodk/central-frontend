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
  <div v-if="dataset.dataExists" id="dataset-overview">
    <page-section id="dataset-overview-form-connections">
      <template #heading>
        <span>{{ $t('connectionsToForms') }}</span>
      </template>
      <template #body>
        <div class="row">
          <div class="col-md-6 creation-forms">
            <connection-to-forms :properties="dataset.properties" :project-id="projectId"/>
          </div>
          <div class="col-md-6 linked-forms">
            <linked-forms :linked-forms="dataset.linkedForms" :project-id="projectId"/>
          </div>
        </div>
      </template>
    </page-section>
    <page-section id="dataset-overview-properties">
      <template #heading>
        <span>{{ $t('datasetProperties') }}</span>
      </template>
      <template #body>
        <dataset-properties :properties="dataset.properties" :project-id="projectId"/>
      </template>
    </page-section>
  </div>
</template>

<script>
import { useRoute } from 'vue-router';
import PageSection from '../page/section.vue';
import ConnectionToForms from './overview/connection-to-forms.vue';
import LinkedForms from './overview/linked-forms.vue';
import DatasetProperties from './overview/dataset-properties.vue';

import { useRequestData } from '../../request-data';

export default {
  name: 'DatasetOverview',
  components: {
    PageSection,
    ConnectionToForms,
    LinkedForms,
    DatasetProperties
  },
  setup() {
    const route = useRoute();
    // The component does not assume that this data will exist when the
    // component is created.
    const { dataset, resourceStates } = useRequestData();
    const { dataExists } = resourceStates([dataset]);
    return { dataset, dataExists, projectId: Number(route.params.projectId) };
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "connectionsToForms": "Connections to Forms",
    // This is a title shown above a section of the page.
    "datasetProperties" : "Dataset Properties"
  }
}
</i18n>
