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
  <div id="entity-show">
    <breadcrumbs v-if="dataExists" :links="breadcrumbLinks"/>
    <page-head v-show="dataExists">
      <template #title>{{ entity.dataExists ? entity.currentVersion.label : '' }}</template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading"/>
      <div v-show="dataExists" class="row">
        <div class="col-xs-4">
          <entity-basic-details/>
          <entity-data @update="updateModal.show()"/>
        </div>
        <div class="col-xs-8">
          <entity-activity @delete="deleteModal.show()"
            @resolve="fetchActivityData"
            @branch-data="branchData.show({ highlight: $event })"/>
        </div>
      </div>
    </page-body>

    <entity-update v-bind="updateModal"
      :entity="entity.dataExists ? entity.data : null" @hide="updateModal.hide()"
      @success="afterUpdate"/>
    <entity-delete v-bind="deleteModal"
      :entity="entity.currentVersion"
      :awaiting-response="awaitingResponse" @hide="deleteModal.hide()"
      @delete="requestDelete"/>
    <entity-branch-data v-if="config.devTools" v-bind="branchData"
      @hide="branchData.hide()"/>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, inject, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import Breadcrumbs from '../breadcrumbs.vue';
import EntityActivity from './activity.vue';
import EntityBasicDetails from './basic-details.vue';
import EntityData from './data.vue';
import EntityDelete from './delete.vue';
import EntityUpdate from './update.vue';
import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';

import useEntity from '../../request-data/entity';
import useEntityVersions from '../../request-data/entity-versions';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { modalData, setDocumentTitle } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityShow'
});
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
provide('projectId', props.projectId);
provide('datasetName', props.datasetName);
provide('uuid', props.uuid);

const { project, dataset, resourceStates } = useRequestData();
const { entity, audits } = useEntity();
const entityVersions = useEntityVersions();
const { initiallyLoading, dataExists } = resourceStates([project, entity]);

Promise.allSettled([
  entity.request({
    url: apiPaths.entity(props.projectId, props.datasetName, props.uuid),
    extended: true
  }),
  project.request({
    url: apiPaths.project(props.projectId),
    extended: true,
    resend: false
  }),
  dataset.request({
    url: apiPaths.dataset(props.projectId, props.datasetName),
    extended: true
  })
]);
const fetchActivityData = () => Promise.allSettled([
  audits.request({
    url: apiPaths.entityAudits(props.projectId, props.datasetName, props.uuid)
  }),
  entityVersions.request({
    url: apiPaths.entityVersions(props.projectId, props.datasetName, props.uuid),
    extended: true
  })
]);
fetchActivityData();

setDocumentTitle(() => [entity.dataExists ? entity.currentVersion.label : null]);

const updateModal = modalData();
const { i18n, alert, config } = inject('container');
const afterUpdate = (updatedEntity) => {
  fetchActivityData();
  updateModal.hide();
  alert.success(i18n.t('alert.updateEntity'));

  // entity.currentVersion will no longer have extended metadata, but we don't
  // need it to.
  entity.currentVersion = updatedEntity.currentVersion;
  entity.updatedAt = updatedEntity.updatedAt;
  // Update entity.conflict in case a conflict has been resolved by another user
  // or in another tab.
  entity.conflict = updatedEntity.conflict;
};

const deleteModal = modalData();
const { request, awaitingResponse } = useRequest();
const router = useRouter();
const { datasetPath, projectPath } = useRoutes();
const { t } = useI18n();
const requestDelete = () => {
  request({
    method: 'DELETE',
    url: apiPaths.entity(props.projectId, props.datasetName, props.uuid),
    fulfillProblem: ({ code }) => code === 404.1
  })
    .then(() => {
      const { label } = entity.currentVersion;
      return router.push(datasetPath('entities'))
        .then(() => { alert.success(t('alert.entityDeleted', { label })); });
    })
    .catch(noop);
};

const EntityBranchData = defineAsyncComponent(loadAsync('EntityBranchData'));
const branchData = modalData('EntityBranchData');

const breadcrumbLinks = computed(() => [
  { text: project.dataExists ? project.nameWithArchived : t('resource.project'), path: projectPath('entity-lists'), icon: 'icon-archive' },
  { text: props.datasetName, path: datasetPath(), icon: 'icon-database' },
  { text: entity.currentVersion.label }
]);

</script>

<style lang="scss">
  #entity-show .page-section-heading {
    font-size: 24px;
  }
</style>

<i18n lang="json5">
{
  "en": {
    "back": {
      // This is shown at the top of the page.
      "title": "Entity Detail",
      // This is shown at the top of the page. The user can click it to go back.
      "back": "Back to {datasetName} Table"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "back": {
      "title": "Detail entity",
      "back": "Zpět na tabulku {datasetName}"
    }
  },
  "de": {
    "back": {
      "title": "Objektdetail",
      "back": "Zurück zu {datasetName} Tabelle"
    }
  },
  "es": {
    "back": {
      "title": "Detalles de la entidad",
      "back": "Volver a la tabla {datasetName}"
    }
  },
  "fr": {
    "back": {
      "title": "Détail de l'entité",
      "back": "Retour à la table {datasetName}"
    }
  },
  "it": {
    "back": {
      "title": "Dettaglio Entità",
      "back": "Indietro alla Tabella {datasetName}"
    }
  },
  "pt": {
    "back": {
      "title": "Detalhes da Entidade",
      "back": "Voltar para a Tabela {datasetName}"
    }
  },
  "sw": {
    "back": {
      "title": "Data ya Huluki",
      "back": "Rudi kwenye Jedwali la {datasetName}"
    }
  },
  "zh": {
    "back": {
      "title": "实体详情",
      "back": "回到{datasetName}表格"
    }
  },
  "zh-Hant": {
    "back": {
      "title": "實體詳細資訊",
      "back": "回到 {datasetName} 表"
    }
  }
}
</i18n>
