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
      <loading :state="entity.initiallyLoading"/>
      <div v-show="entity.dataExists" class="row">
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
      :label="entity.dataExists ? entity.currentVersion.label : ''"
      :awaiting-response="awaitingResponse" @hide="deleteModal.hide()"
      @delete="requestDelete"/>
    <entity-branch-data v-bind="branchData" @hide="branchData.hide()"/>
  </div>
</template>

<script setup>
import { inject, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import EntityActivity from './activity.vue';
import EntityBasicDetails from './basic-details.vue';
import EntityBranchData from './branch-data.vue';
import EntityData from './data.vue';
import EntityDelete from './delete.vue';
import EntityUpdate from './update.vue';
import Loading from '../loading.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';

import useEntity from '../../request-data/entity';
import useEntityVersions from '../../request-data/entity-versions';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
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

const { project, dataset } = useRequestData();
const { entity, audits } = useEntity();
const entityVersions = useEntityVersions();

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
const { i18n, alert } = inject('container');
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
const { datasetPath } = useRoutes();
const { t } = useI18n();
const requestDelete = () => {
  request({
    method: 'DELETE',
    url: apiPaths.entity(props.projectId, props.datasetName, props.uuid)
  })
    .then(() => {
      const { label } = entity.currentVersion;
      return router.push(datasetPath('entities'))
        .then(() => { alert.success(t('alert.delete', { label })); });
    })
    .catch(noop);
};

const branchData = modalData();
</script>

<i18n lang="json5">
{
  "en": {
    "back": {
      // This is shown at the top of the page.
      "title": "Entity Detail",
      // This is shown at the top of the page. The user can click it to go back.
      "back": "Back to {datasetName} Table"
    },
    "alert": {
      // @transifexKey component.EntityList.alert.delete
      "delete": "Entity “{label}” has been deleted."
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
      "title": "Entitätsdetail",
      "back": "Zurück zu {datasetName} Tabelle"
    },
    "alert": {
      "delete": "Die Entität \"{label}“ wurde gelöscht."
    }
  },
  "es": {
    "back": {
      "title": "Detalles de la entidad",
      "back": "Volver a la tabla {datasetName}"
    },
    "alert": {
      "delete": "Entidad “{label}” se ha eliminado."
    }
  },
  "fr": {
    "back": {
      "title": "Détail de l'entité",
      "back": "Retour à la table {datasetName}"
    },
    "alert": {
      "delete": "L'Entité \"{label}\" a été supprimée."
    }
  },
  "it": {
    "back": {
      "title": "Dettaglio Entità",
      "back": "Indietro alla Tabella {datasetName}"
    },
    "alert": {
      "delete": "La Entità “{label}” è stata cancellata."
    }
  },
  "sw": {
    "back": {
      "title": "Data ya Huluki",
      "back": "Rudi kwenye Jedwali la {datasetName}"
    }
  },
  "zh-Hant": {
    "back": {
      "title": "實體詳細資訊",
      "back": "回到 {datasetName} 表"
    },
    "alert": {
      "delete": "實體「1{label}」已被刪除。"
    }
  }
}
</i18n>
