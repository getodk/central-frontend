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
  <div>
    <page-back v-show="entity.dataExists" :to="datasetPath('entities')">
      <template #title>{{ $t('back.title') }}</template>
      <template #back>{{ $t('back.back', { datasetName }) }}</template>
    </page-back>
    <page-head v-show="entity.dataExists">
      <template #title>{{ entity.dataExists ? entity.currentVersion.label : '' }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists" class="row">
        <div class="col-xs-4">
          <entity-basic-details/>
          <entity-data/>
        </div>
        <div class="col-xs-8">
          <entity-activity/>
        </div>
      </div>
    </page-body>
  </div>
</template>

<script>
export default {
  name: 'EntityShow'
};
</script>
<script setup>
import Loading from '../loading.vue';
import EntityActivity from './activity.vue';
import EntityBasicDetails from './basic-details.vue';
import EntityData from './data.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';

import useRoutes from '../../composables/routes';
import useEntity from '../../request-data/entity';
import { apiPaths } from '../../util/request';
import { setDocumentTitle } from '../../util/reactivity';
import { useRequestData } from '../../request-data';

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  datasetName: {
    type: String,
    required: true
  },
  uuid: {
    type: String,
    required: true
  }
});

const { project, dataset, resourceStates } = useRequestData();
const { entity, audits, diffs } = useEntity();
const { initiallyLoading, dataExists } = resourceStates([project, entity]);

Promise.allSettled([
  project.request({
    url: apiPaths.project(props.projectId),
    extended: true,
    resend: false
  }),
  entity.request({
    url: apiPaths.entity(props.projectId, props.datasetName, props.uuid),
    extended: true
  }),
  dataset.request({
    url: apiPaths.dataset(props.projectId, props.datasetName),
    extended: true
  }),
  audits.request({
    url: apiPaths.entityAudits(props.projectId, props.datasetName, props.uuid),
    extended: true
  }),
  diffs.request({
    url: apiPaths.entityDiffs(props.projectId, props.datasetName, props.uuid)
  })
]);

setDocumentTitle(() => [entity.dataExists ? entity.currentVersion.label : null]);

const { datasetPath } = useRoutes();
</script>

<i18n lang="json5">
{
  "en": {
    // This is shown at the top of the page.
    "back": {
      "title": "Entity Detail",
      "back": "Back to {datasetName} Table"
    }
  }
}
</i18n>
