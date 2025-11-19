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
  <div id="dataset-entities">
    <page-section>
      <template #heading>
        <div class="dataset-entities-heading-row">
          <button v-if="project.dataExists && project.permits('entity.create')"
            id="dataset-entities-upload-button" type="button"
            class="btn btn-primary" @click="upload.show()">
            <span class="icon-upload"></span>{{ $t('upload') }}
          </button>
          <template v-if="deletedEntityCount.dataExists">
            <button v-if="canDelete && (deletedEntityCount.value > 0 || deleted)" type="button"
              class="btn toggle-deleted-entities" :class="{ 'btn-danger': deleted, 'btn-link': !deleted }"
              @click="toggleDeleted">
              <span class="icon-trash"></span>{{ $tcn('action.toggleDeletedEntities', deletedEntityCount.value) }}
              <span v-show="deleted" class="icon-close"></span>
            </button>
          </template>
          <p v-show="deleted" class="purge-description">{{ $t('purgeDescription') }}</p>
          <odata-data-access :analyze-disabled="deleted"
            :analyze-disabled-message="$t('analyzeDisabledDeletedData')"
            @analyze="analyze.show()"/>
        </div>
      </template>
      <template #body>
        <entity-list ref="list" :project-id="projectId"
        :dataset-name="datasetName" :deleted="deleted"
        @fetch-deleted-count="fetchDeletedCount"/>
      </template>
    </page-section>

    <entity-upload v-if="dataset.dataExists" v-bind="upload"
      @hide="upload.hide()" @success="afterUpload"/>
    <odata-analyze v-bind="analyze" :odata-url="odataUrl" @hide="analyze.hide()"/>
  </div>
</template>

<script>
import { defineAsyncComponent, watchEffect, computed } from 'vue';
import { useRouter } from 'vue-router';

import EntityList from '../entity/list.vue';
import OdataAnalyze from '../odata/analyze.vue';
import OdataDataAccess from '../odata/data-access.vue';
import PageSection from '../page/section.vue';
import useEntities from '../../request-data/entities';
import useQueryRef from '../../composables/query-ref';

import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { modalData } from '../../util/reactivity';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

export default {
  name: 'DatasetEntities',
  components: {
    OdataAnalyze,
    OdataDataAccess,
    EntityList,
    EntityUpload: defineAsyncComponent(loadAsync('EntityUpload')),
    PageSection
  },
  inject: ['alert'],
  provide() {
    return { projectId: this.projectId, datasetName: this.datasetName };
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    datasetName: {
      type: String,
      required: true
    }
  },
  setup() {
    const { project, dataset } = useRequestData();
    const { deletedEntityCount } = useEntities();
    const router = useRouter();

    const deleted = useQueryRef({
      fromQuery: (query) => {
        if (typeof query.deleted === 'string' && query.deleted === 'true') {
          return true;
        }
        return false;
      },
      toQuery: (value) => ({
        deleted: value === true ? 'true' : null
      })
    });

    const canDelete = computed(() => project.dataExists && project.permits('entity.delete'));

    watchEffect(() => {
      if (deleted.value && project.dataExists && !canDelete.value) router.push('/');
    });

    return { project, dataset, deletedEntityCount, deleted, canDelete };
  },
  data() {
    return {
      upload: modalData('EntityUpload'),
      analyze: modalData()
    };
  },
  computed: {
    odataUrl() {
      const path = apiPaths.odataEntitiesSvc(this.projectId, this.datasetName);
      return `${window.location.origin}${path}`;
    }
  },
  created() {
    if (!this.deleted) this.fetchDeletedCount();
  },
  methods: {
    afterUpload(count) {
      this.upload.hide();
      this.alert.success(this.$t('alert.upload'));
      this.$refs.list.reset();
      // Update dataset.entities so that the count in the OData loading message
      // reflects the new entities.
      this.dataset.entities += count;
    },
    fetchDeletedCount() {
      this.deletedEntityCount.request({
        method: 'GET',
        url: apiPaths.odataEntities(
          this.projectId,
          this.datasetName,
          {
            $top: 0,
            $count: true,
            $filter: '__system/deletedAt ne null',
          }
        ),
        clear: false,
      }).catch(noop);
    },
    toggleDeleted() {
      const { path } = this.$route;
      this.$router.push(this.deleted ? path : `${path}?deleted=true`);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#dataset-entities {
  .toggle-deleted-entities {
    margin-left: 8px;

    &.btn-link {
      color: $color-danger;
    }

    .icon-close { margin-left: 3px; }
  }

  .purge-description {
    display: inline;
    position: relative;
    left: 12px;
    font-size: 14px;
    margin-bottom: 0;
  }

  .dataset-entities-heading-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  #odata-data-access {
    margin-left: auto;
    font-size: initial;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "upload": "Upload Entities",
    "alert": {
      "upload": "Your Entities have been successfully uploaded."
    },
    "purgeDescription": "Entities are deleted after 30 days in the Trash",
    "action": {
      "toggleDeletedEntities": "{count} deleted Entity | {count} deleted Entities"
    },
    "analyzeDisabledDeletedData": "OData access is unavailable for deleted Entities",
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "upload": "Objekte hochladen",
    "alert": {
      "upload": "Ihre Objekte wurden erfolgreich hochgeladen."
    },
    "purgeDescription": "Objekte werden nach 30 Tagen im Papierkorb gelöscht",
    "action": {
      "toggleDeletedEntities": "{count} gelöschtes Objekt | {count} gelöschte Objekte"
    },
    "analyzeDisabledDeletedData": "Der OData-Zugriff ist für gelöschte Objekte nicht verfügbar"
  },
  "es": {
    "upload": "Subir entidades",
    "alert": {
      "upload": "Sus Entidades han sido cargadas con éxito."
    },
    "purgeDescription": "Las Entidades se eliminan después de 30 días en la Papelera",
    "action": {
      "toggleDeletedEntities": "{count} Entidad eliminada | {count} Entidades eliminadas | {count} Entidades eliminadas"
    },
    "analyzeDisabledDeletedData": "El acceso OData no está disponible para Entidades eliminadas"
  },
  "fr": {
    "upload": "Téléverser des entités",
    "alert": {
      "upload": "Vos Entités ont été téléversées."
    },
    "purgeDescription": "Les entités sont supprimées après 30 jours passés dans la corbeille.",
    "action": {
      "toggleDeletedEntities": "{count} entité supprimée. | {count} Entités supprimées. | {count} Entités supprimées."
    },
    "analyzeDisabledDeletedData": "L'accès OData n'est pas disponible pour les entités supprimées"
  },
  "it": {
    "upload": "Caricare Entità",
    "alert": {
      "upload": "Le entità sono state caricate con successo."
    },
    "purgeDescription": "Le Entità vengono eliminate dopo 30 giorni nel Cestino",
    "action": {
      "toggleDeletedEntities": "{count} Entità cancellata | {count} Entità cancellate | {count} Entità cancellate"
    },
    "analyzeDisabledDeletedData": "L'accesso OData non è disponibile per gli Entità cancellate"
  },
  "pt": {
    "upload": "Carregar Entidades",
    "alert": {
      "upload": "Suas Entidades foram carregadas com sucesso."
    },
    "purgeDescription": "Entidades são excluídas após 30 dias na Lixeira",
    "action": {
      "toggleDeletedEntities": "{count} Entidade excluída | {count} Entidades excluídas | {count} Entidades excluídas"
    },
    "analyzeDisabledDeletedData": "O acesso OData não está disponível para Entidades excluídas"
  },
  "zh": {
    "upload": "上传实体",
    "alert": {
      "upload": "您的实体已成功上传。"
    },
    "purgeDescription": "实体将在30天后从垃圾箱中删除",
    "action": {
      "toggleDeletedEntities": "{count}个已删除的实体"
    },
    "analyzeDisabledDeletedData": "已删除的实体无法使用 OData 访问"
  },
  "zh-Hant": {
    "upload": "上傳實體",
    "alert": {
      "upload": "您的實體已成功上傳。"
    },
    "purgeDescription": "實體將在 30 天後從垃圾箱中刪除",
    "action": {
      "toggleDeletedEntities": "{count} 個已刪除的實體"
    },
    "analyzeDisabledDeletedData": "已刪除實體的 OData 存取不可用"
  }
}
</i18n>
