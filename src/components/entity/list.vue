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
  <div id="entity-list">
    <div id="entity-list-actions" class="table-actions-bar">
      <form class="form-inline" @submit.prevent>
        <div class="form-group">
          <span class="icon-filter"></span>
        </div>
        <div class="form-group">
          <input v-model="searchTextbox" class="form-control search-textbox" :placeholder="$t('common.search')"
            :aria-label="$t('common.search')" :aria-disabled="deleted" autocomplete="off" @keydown.enter="setSearchTerm">
          <button v-show="searchTextbox" type="button" class="close"
            :aria-label="$t('action.clearSearch')" @click="clearSearch">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <entity-filters v-model:conflict="conflict" :disabled="deleted"
        :disabled-message="deleted ? $t('filterDisabledMessage') : null"/>
      </form>
      <button id="entity-list-refresh-button" type="button"
        class="btn btn-outlined" :aria-disabled="refreshing"
        @click="fetchChunk(false, true)">
        <span class="icon-refresh"></span>{{ $t('action.refresh') }}
        <spinner :state="refreshing"/>
      </button>
      <teleport-if-exists v-if="odataEntities.dataExists" to=".dataset-entities-heading-row">
        <entity-download-button :odata-filter="deleted ? null : odataFilter"
        :disabled="deleted"
        v-tooltip.aria-describedby="deleted ? $t('downloadDisabled') : null"/>
      </teleport-if-exists>
    </div>
    <entity-table v-show="odataEntities.dataExists" ref="table"
      :properties="dataset.properties"
      :deleted="deleted" :awaiting-deleted-responses="awaitingResponses"
      @update="showUpdate"
      @resolve="showResolve" @delete="showDelete" @restore="showRestore"/>

    <p v-show="emptyTableMessage" class="empty-table-message">
      {{ emptyTableMessage }}
    </p>
    <odata-loading-message type="entity"
      :top="pagination.size"
      :odata="odataEntities"
      :filter="odataFilter != null || !!searchTerm"
      :refreshing="refreshing"
      :total-count="dataset.dataExists ? dataset.entities : 0"/>

    <!-- @update:page is emitted on size change as well -->
    <pagination v-if="pagination.count > 0"
            v-model:page="pagination.page" v-model:size="pagination.size"
            :count="pagination.count" :size-options="pageSizeOptions"
            :spinner="odataEntities.awaitingResponse"
            @update:page="handlePageChange()"/>

    <entity-update v-bind="update" @hide="hideUpdate" @success="afterUpdate"/>
    <entity-resolve v-bind="resolve" @hide="hideResolve" @success="afterResolve"/>
    <entity-delete v-bind="deleteModal" checkbox
      :awaiting-response="deleteModal.state && awaitingResponses.has(deleteModal.entity.__id)"
      @hide="deleteModal.hide()" @delete="requestDelete"/>
    <entity-restore v-bind="restoreModal" checkbox
      :awaiting-response="restoreModal.state && awaitingResponses.has(restoreModal.entity.__id)"
      @hide="restoreModal.hide()" @restore="requestRestore"/>
  </div>
</template>

<script>
import { reactive } from 'vue';

import EntityDownloadButton from './download-button.vue';
import EntityDelete from './delete.vue';
import EntityRestore from './restore.vue';
import EntityFilters from './filters.vue';
import EntityTable from './table.vue';
import EntityUpdate from './update.vue';
import EntityResolve from './resolve.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import Spinner from '../spinner.vue';
import Pagination from '../pagination.vue';
import TeleportIfExists from '../teleport-if-exists.vue';

import useQueryRef from '../../composables/query-ref';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { odataEntityToRest } from '../../util/odata';
import { useRequestData } from '../../request-data';

export default {
  name: 'EntityList',
  components: {
    EntityDelete,
    EntityDownloadButton,
    EntityRestore,
    EntityFilters,
    EntityResolve,
    EntityTable,
    EntityUpdate,
    OdataLoadingMessage,
    Pagination,
    Spinner,
    TeleportIfExists
  },
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    },
    datasetName: {
      type: String,
      required: true
    },
    deleted: {
      type: Boolean,
      required: false
    }
  },
  emits: ['fetch-deleted-count'],
  setup() {
    // The dataset request object is how we get access to the
    // dataset properties for the columns.
    const { dataset, deletedEntityCount, odataEntities } = useRequestData();

    // Array of conflict statuses, where a conflict status is represented as a
    // boolean
    const conflict = useQueryRef({
      fromQuery: (query) => (query.conflict === 'true'
        ? [true]
        : (query.conflict === 'false' ? [false] : [true, false])),
      toQuery: (value) => ({
        conflict: value.length === 2 ? null : value[0].toString()
      })
    });

    // works in conjunction with searchTextbox
    const searchTerm = useQueryRef({
      fromQuery: (query) => (typeof query.search === 'string' ? query.search : null),
      toQuery: (value) => ({
        search: !value ? null : value
      })
    });

    const { request } = useRequest();

    const pageSizeOptions = [250, 500, 1000];

    return { dataset, odataEntities, conflict, request, deletedEntityCount, pageSizeOptions, searchTerm };
  },
  data() {
    return {
      refreshing: false,

      // The index of the entity being updated
      updateIndex: null,
      update: modalData(),

      // The index of the entity being resolved
      resolveIndex: null,
      resolve: modalData(),

      // state that indicates whether we need to show delete confirmation dialog
      confirmDelete: true,
      deleteModal: modalData(),

      // state that indicates whether we need to show restore confirmation dialog
      confirmRestore: true,
      restoreModal: modalData(),

      awaitingResponses: new Set(),

      pagination: { page: 0, size: this.pageSizeOptions[0], count: 0 },
      now: new Date().toISOString(),
      snapshotFilter: '',

      searchTextbox: this.searchTerm ?? ''
    };
  },
  computed: {
    odataFilter() {
      return this.conflict.length === 2
        ? null
        : (this.conflict[0] ? '__system/conflict ne null' : '__system/conflict eq null');
    },
    emptyTableMessage() {
      if (!this.odataEntities.dataExists) return '';
      if (this.odataEntities.value.length > 0) return '';

      if (this.odataEntities.removedEntities.size === this.odataEntities.count && this.odataEntities.count > 0) {
        return this.deleted ? this.$t('deletedEntity.allRestored') : this.$t('allDeleted');
      }
      if (this.odataEntities.removedEntities.size > 0 && this.odataEntities.value.length === 0) {
        return this.deleted ? this.$t('deletedEntity.allRestoredOnPage') : this.$t('allDeletedOnPage');
      }
      return this.deleted ? this.$t('deletedEntity.emptyTable')
        : (this.odataFilter ? this.$t('noMatching') : this.$t('noEntities'));
    }
  },
  watch: {
    searchTerm() {
      this.searchTextbox = this.searchTerm;
    },
    deleted() {
      this.fetchChunk(true);
    },
    'odataEntities.count': {
      handler() {
        if (this.dataset.dataExists && this.odataEntities.dataExists && !this.odataFilter && !this.deleted && !this.searchTerm)
          this.dataset.entities = this.odataEntities.count;
      }
    },
    'odataEntities.removedEntities.size': {
      handler(size) {
        if (this.dataset.dataExists && this.odataEntities.dataExists && !this.odataFilter && !this.deleted && !this.searchTerm) {
          this.dataset.entities = this.odataEntities.count - size;
        }
      }
    }
  },
  created() {
    this.fetchChunk(true);
    this.$watch(() => [this.odataFilter, this.searchTerm], () => this.fetchChunk(true));
  },
  methods: {
    // `clear` indicates whether this.odataEntities should be cleared before
    // sending the request. `refresh` indicates whether the request is a
    // background refresh (whether the refresh button was pressed).
    fetchChunk(clear, refresh = false) {
      this.refreshing = refresh;
      // Are we fetching the first chunk of entities or the next chunk?
      const first = clear || refresh;

      if (first) {
        this.now = new Date().toISOString();
        this.setSnapshotFilter();
        this.pagination.page = 0;
      }

      let $filter = this.snapshotFilter;
      if (this.odataFilter) {
        $filter += ` and ${this.odataFilter}`;
      }

      const $search = this.searchTerm ? this.searchTerm : undefined;

      this.odataEntities.request({
        url: apiPaths.odataEntities(
          this.projectId,
          this.datasetName,
          {
            $top: this.pagination.size,
            $skip: this.pagination.page * this.pagination.size,
            $count: true,
            $search,
            $filter,
            $orderby: '__system/createdAt desc'
          }
        ),
        clear,
        patch: !first
          ? (response) => this.odataEntities.replaceData(response.data, response.config)
          : null
      })
        .then(() => {
          this.pagination.count = this.odataEntities.count;

          if (this.deleted) {
            this.deletedEntityCount.cancelRequest();
            if (!this.deletedEntityCount.dataExists) {
              this.deletedEntityCount.data = reactive({});
            }
            this.deletedEntityCount.value = this.odataEntities.count;
          }
        })
        .finally(() => { this.refreshing = false; })
        .catch(noop);

      // emit event to parent component to re-fetch deleted Entity count
      if (refresh && !this.deleted) {
        this.$emit('fetch-deleted-count');
      }
    },
    setSnapshotFilter() {
      this.snapshotFilter = '';
      if (this.deleted) {
        this.snapshotFilter += `__system/deletedAt le ${this.now}`;
      } else {
        this.snapshotFilter += `__system/createdAt le ${this.now} and `;
        this.snapshotFilter += `(__system/deletedAt eq null or __system/deletedAt gt ${this.now})`;
      }
    },
    // This method is called directly by DatasetEntities.
    reset() {
      if (this.odataFilter == null && !this.searchTerm)
        this.fetchChunk(true);
      else {
        // This change will cause the watcher in created() to fetch
        // entities.
        this.conflict = [true, false];
        this.searchTerm = '';
      }
    },
    showUpdate(index) {
      if (this.refreshing) return;
      this.updateIndex = index;
      const odataEntity = this.odataEntities.value[index];
      this.update.show({
        entity: odataEntityToRest(odataEntity, this.dataset.properties)
      });
    },
    hideUpdate() {
      this.update.hide();
      this.updateIndex = null;
      if (this.resolveIndex != null) {
        this.showResolve(this.resolveIndex);
      }
    },
    afterUpdate(updatedEntity) {
      const index = this.updateIndex;
      this.hideUpdate();
      this.alert.success(this.$t('alert.updateEntity'));

      // Update the OData using the REST response.
      const oldOData = this.odataEntities.value[index];
      const newOData = Object.assign(Object.create(null), {
        __id: oldOData.__id,
        label: updatedEntity.currentVersion.label,
        __system: {
          ...oldOData.__system,
          version: updatedEntity.currentVersion.version,
          updates: oldOData.__system.updates + 1,
          updatedAt: updatedEntity.updatedAt
        }
      });
      const { data: updatedData } = updatedEntity.currentVersion;
      for (const { name, odataName } of this.dataset.properties)
        newOData[odataName] = updatedData[name];
      this.odataEntities.value[index] = newOData;

      if (this.resolveIndex == null)
        this.$refs.table.afterUpdate(index);
      else
        this.showResolve(this.resolveIndex);
    },
    showResolve(index) {
      if (this.refreshing) return;
      this.resolveIndex = index;
      this.resolve.show({ entity: this.odataEntities.value[index] });
    },
    hideResolve(showUpdate) {
      if (showUpdate) {
        this.resolve.hide(false);
        this.$nextTick(() => this.showUpdate(this.resolveIndex));
      } else {
        this.resolve.hide();
        this.resolveIndex = null;
      }
    },
    afterResolve(updatedEntity) {
      // Update the OData using the REST response.
      const newOData = Object.create(null);
      Object.assign(newOData, this.odataEntities.value[this.resolveIndex]);
      newOData.__system = {
        ...newOData.__system,
        conflict: null,
        updatedAt: updatedEntity.updatedAt
      };
      this.odataEntities.value[this.resolveIndex] = newOData;

      this.$refs.table.afterUpdate(this.resolveIndex);
    },
    showDelete(entity) {
      if (this.confirmDelete) {
        this.deleteModal.show({ entity });
      } else {
        this.requestDelete([entity, this.confirmDelete]);
      }
    },
    requestDelete(event) {
      const [{ __id: uuid, label }, confirm] = event;

      this.awaitingResponses.add(uuid);

      this.request({
        method: 'DELETE',
        url: apiPaths.entity(this.projectId, this.datasetName, uuid)
      })
        .then(() => {
          this.deleteModal.hide();
          if (this.deletedEntityCount.dataExists) this.deletedEntityCount.value += 1;

          this.alert.success(this.$t('alert.entityDeleted', { label }));
          if (confirm != null) this.confirmDelete = confirm;

          this.odataEntities.removedEntities.add(uuid);

          /* Before doing a couple more things, we first determine whether
          this.odataEntities.value still includes the entity and if so, what the
          current index of the entity is. If a request to refresh
          this.odataEntities was sent while the deletion request was in
          progress, then there could be a race condition such that data doesn't
          exist for this.odataEntities, or this.odataEntities.value no longer
          includes the entity. Another possible result of the race condition is
          that this.odataEntities.value still includes the entity, but the
          entity's index has changed. */
          const index = this.odataEntities.dataExists
            ? this.odataEntities.value.findIndex(entity => entity.__id === uuid)
            : -1;
          if (index !== -1) {
            this.$refs.table.afterDelete(index);
            this.odataEntities.value.splice(index, 1);
          }
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(uuid);
        });
    },
    showRestore(entity) {
      if (this.confirmRestore) {
        this.restoreModal.show({ entity });
      } else {
        this.requestRestore([entity, this.confirmRestore]);
      }
    },
    requestRestore(event) {
      const [{ __id: uuid, label }, confirm] = event;

      this.awaitingResponses.add(uuid);

      this.request({
        method: 'POST',
        url: apiPaths.entityRestore(this.projectId, this.datasetName, uuid)
      })
        .then(() => {
          this.restoreModal.hide();
          if (this.deletedEntityCount.dataExists && this.deletedEntityCount.value > 0) {
            this.deletedEntityCount.value -= 1;
          }

          this.alert.success(this.$t('alert.entityRestored', { label }));
          if (confirm != null) this.confirmRestore = confirm;

          this.odataEntities.removedEntities.add(uuid);

          // See the comments in requestDelete().
          const index = this.odataEntities.dataExists
            ? this.odataEntities.value.findIndex(entity => entity.__id === uuid)
            : -1;
          if (index !== -1) {
            this.$refs.table.afterDelete(index);
            this.odataEntities.value.splice(index, 1);
          }
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(uuid);
        });
    },
    handlePageChange() {
      // This function is called for size change as well. So when the total number of entities are
      // less than the lowest size option, hence we don't need to make a request.
      if (this.odataEntities.count < this.pageSizeOptions[0]) return;
      this.fetchChunk(false);
    },
    clearSearch() {
      this.searchTerm = '';
    },
    setSearchTerm() {
      this.searchTerm = this.searchTextbox;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-list {
  // Make sure that there is enough space for the DateRangePicker when it is
  // open.
  min-height: 375px;
}

#entity-list-actions {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap-reverse;
}
#entity-list-refresh-button {
  margin-left: auto;
}

#entity-list table:has(tbody:empty) {
    display: none;
  }

#entity-table:has(tbody tr) + .empty-table-message {
  display: none;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown when there are no Entities to show in a table.
    "noEntities": "There are no Entities to show.",
    "noMatching": "There are no matching Entities.",
    "allDeleted": "All Entities are deleted.",
    "allDeletedOnPage": "All Entities on the page have been deleted.",
    "alert": {
      "delete": "Entity “{label}” has been deleted."
    },
    "filterDisabledMessage": "Filtering is unavailable for deleted Entities",
    "downloadDisabled": "Download is unavailable for deleted Entities",
    "deletedEntity": {
      "emptyTable": "There are no deleted Entities.",
      "allRestored": "All deleted Entities are restored.",
      "allRestoredOnPage": "All Entities on the page have been restored."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noEntities": "Nejsou zde žádné subjekty, které by bylo možné zobrazit.",
    "noMatching": "Neexistují žádné odpovídající entity."
  },
  "de": {
    "noEntities": "Es gibt keine Entitäten zum Anzeigen.",
    "noMatching": "Es gibt keine passenden Entitäten.",
    "allDeleted": "Alle Entitäten werden gelöscht.",
    "allDeletedOnPage": "Alle Entitäten auf der Seite wurden gelöscht.",
    "alert": {
      "delete": "Die Entität \"{label}“ wurde gelöscht."
    },
    "filterDisabledMessage": "Filterung ist für gelöschte Entitäten nicht verfügbar",
    "downloadDisabled": "Der Download ist für gelöschte Entitäten nicht verfügbar",
    "deletedEntity": {
      "emptyTable": "Es gibt keine gelöschten Entitäten.",
      "allRestored": "Alle gelöschten Entitäten werden wiederhergestellt.",
      "allRestoredOnPage": "Alle Entitäten auf der Seite wurden wiederhergestellt."
    }
  },
  "es": {
    "noEntities": "No hay Entidades para mostrar.",
    "noMatching": "No hay entidades coincidentes.",
    "allDeleted": "Se eliminan todas las Entidades.",
    "allDeletedOnPage": "Se han eliminado todas las Entidades de la página.",
    "alert": {
      "delete": "Entidad “{label}” se ha eliminado."
    },
    "filterDisabledMessage": "El Filtro no está disponible para Entidades eliminadas",
    "downloadDisabled": "La descarga no está disponible para Entidades eliminadas",
    "deletedEntity": {
      "emptyTable": "No hay entidades eliminadas.",
      "allRestored": "Todas las Entidades eliminadas se restauran.",
      "allRestoredOnPage": "Se han restaurado todas las Entidades de la página."
    }
  },
  "fr": {
    "noEntities": "Pas d'entités à montrer.",
    "noMatching": "Il n'y a pas d'Entités correspondantes",
    "allDeleted": "Toutes les Entités sont supprimées.",
    "allDeletedOnPage": "Toutes les Entités de la page ont été supprimées.",
    "alert": {
      "delete": "L'Entité \"{label}\" a été supprimée."
    },
    "filterDisabledMessage": "Le filtrage n'est pas disponible pour les entités supprimées.",
    "downloadDisabled": "Le téléchargement n'est pas disponible pour les entités supprimées.",
    "deletedEntity": {
      "emptyTable": "Il n'y a pas d'Entité supprimée.",
      "allRestored": "Toutes les Entités supprimées ont été restaurées.",
      "allRestoredOnPage": "Toutes les Entités de la page ont été restaurées."
    }
  },
  "it": {
    "noEntities": "Non ci sono entità da mostrare.",
    "noMatching": "Non sono presenti Entità corrispondenti.",
    "allDeleted": "Tutte le entità vengono eliminate.",
    "allDeletedOnPage": "Tutte le entità della pagina sono state eliminate.",
    "alert": {
      "delete": "La Entità “{label}” è stata cancellata."
    },
    "filterDisabledMessage": "Il filtro non è disponibile per le Entità eliminate.",
    "downloadDisabled": "Il download non è disponibile per le Entità eliminate",
    "deletedEntity": {
      "emptyTable": "Non ci sono Entità cancellate.",
      "allRestored": "Tutte le entità eliminate vengono ripristinate.",
      "allRestoredOnPage": "Tutte le entità della pagina sono state ripristinate."
    }
  },
  "pt": {
    "noEntities": "Não há Entidades para mostrar.",
    "noMatching": "Não há Entidades correspondentes.",
    "alert": {
      "delete": "A Entidade \"{label}\" foi excluída."
    },
    "filterDisabledMessage": "Não é possível filtrar Entidades excluídas",
    "downloadDisabled": "Não é possível fazer download de Entidades excluídas"
  },
  "sw": {
    "noEntities": "Hakuna Fomu za kuonyesha.",
    "noMatching": "Hakuna Huluki zinazolingana."
  },
  "zh-Hant": {
    "noEntities": "沒有可顯示的實體。",
    "noMatching": "無相符的實體。",
    "alert": {
      "delete": "實體「1{label}」已被刪除。"
    }
  }
}
</i18n>
