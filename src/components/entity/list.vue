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
  <div id="entity-list" :class="{ 'bulk-operation-in-progress': bulkOperationInProgress }">
    <disable-container :disabled="bulkOperationInProgress"
      :disabled-message="$t('bulkOpInProgress')">
      <div id="entity-list-actions" class="table-actions-bar">
        <form class="form-inline" @submit.prevent>
          <search-textbox v-model="searchTerm" :label="$t('common.search')" :hide-label="true" :disabled="deleted" :disabled-message="deleted ? $t('searchDisabledMessage') : null"/>
          <entity-filters v-model:conflict="conflict" v-model:creatorId="creatorIds" v-model:creationDate="creationDateRange"
          :disabled="deleted" :disabled-message="deleted ? $t('filterDisabledMessage') : null" @reset-click="resetFilters"/>
        </form>
        <radio-field v-if="dataset.dataExists && dataset.hasGeometry"
          v-model="dataView" :options="viewOptions" :disabled="deleted"
          :disabled-message="$t('mapDisabled')" button-appearance/>
        <teleport-if-exists v-if="odataEntities.dataExists" to=".dataset-entities-heading-row">
          <entity-download-button :odata-filter="deleted ? null : odataFilter"
          :search-term="deleted ? null : searchTerm"
          :disabled="deleted"
          v-tooltip.aria-describedby="deleted ? $t('downloadDisabled') : null"/>
        </teleport-if-exists>
      </div>
      <table-refresh-bar :odata="odataEntities"
        :refreshing="refreshing" @refresh-click="refresh"/>
      <p v-show="emptyMessage" class="empty-table-message">
        {{ emptyMessage }}
      </p>

      <entity-table-view v-if="dataView === 'table'" ref="view"
        v-model:all-selected="allSelected" :deleted="deleted"
        :filter="odataFilter" :search-term="searchTerm"
        :awaiting-responses="awaitingResponses"
        @selection-changed="handleSelectionChange"
        @clear-selection="clearSelectedEntities"
        @update="showUpdate" @resolve="showResolve" @delete="showDelete"
        @restore="showRestore"/>
      <entity-map-view v-else ref="view" :filter="geojsonFilter"
        :search-term="searchTerm" :awaiting-responses="awaitingResponses"/>
    </disable-container>

    <entity-update v-bind="update" @hide="hideUpdate" @success="afterUpdate"/>
    <entity-resolve v-bind="resolve" @hide="hideResolve" @success="afterResolve"/>
    <entity-delete v-bind="deleteModal"
      :awaiting-response="deleteModal.state && awaitingResponses.has(deleteModal.entity.__id)"
      @hide="deleteModal.hide()" @delete="requestDelete"/>
    <entity-restore v-bind="restoreModal" checkbox
      :awaiting-response="restoreModal.state && awaitingResponses.has(restoreModal.entity.__id)"
      @hide="restoreModal.hide()" @restore="requestRestore"/>
    <action-bar :state="actionBarState"
      :message="$tcn('actionBar.message', selectedEntities.size)"
      :disable-close="bulkOperationInProgress"
      @hide="clearSelectedEntities()">
        <button class="btn btn-primary" type="button" :aria-disabled="bulkOperationInProgress" @click="requestBulkDelete">
          <span class="icon-trash"></span>
          {{ $t('action.delete') }}
          <spinner :state="bulkOperationInProgress"/>
        </button>
    </action-bar>
  </div>
</template>

<script>
import { watch } from 'vue';

import ActionBar from '../action-bar.vue';
import DisableContainer from '../disable-container.vue';
import EntityDownloadButton from './download-button.vue';
import EntityDelete from './delete.vue';
import EntityMapView from './map-view.vue';
import EntityRestore from './restore.vue';
import EntityFilters from './filters.vue';
import EntityTableView from './table-view.vue';
import EntityUpdate from './update.vue';
import EntityResolve from './resolve.vue';
import RadioField from '../radio-field.vue';
import TableRefreshBar from '../table-refresh-bar.vue';
import TeleportIfExists from '../teleport-if-exists.vue';
import SearchTextbox from '../search-textbox.vue';
import Spinner from '../spinner.vue';

import useDataView from '../../composables/data-view';
import useQueryRef from '../../composables/query-ref';
import useDateRangeQueryRef from '../../composables/date-range-query-ref';
import useRequest from '../../composables/request';
import { apiPaths, requestAlertMessage } from '../../util/request';
import { joinSentences } from '../../util/i18n';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { odataEntityToRest } from '../../util/odata';
import { useRequestData } from '../../request-data';
import { arrayQuery } from '../../util/router';

export default {
  name: 'EntityList',
  components: {
    ActionBar,
    DisableContainer,
    EntityDelete,
    EntityDownloadButton,
    EntityFilters,
    EntityMapView,
    EntityResolve,
    EntityRestore,
    EntityTableView,
    EntityUpdate,
    RadioField,
    SearchTextbox,
    Spinner,
    TableRefreshBar,
    TeleportIfExists
  },
  inject: ['alert', 'container'],
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
    const { dataset, deletedEntityCount, odataEntities, entityCreators } = useRequestData();

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

    const searchTerm = useQueryRef({
      fromQuery: (query) => (typeof query.search === 'string' ? query.search : null),
      toQuery: (value) => ({
        search: !value ? null : value
      })
    });

    const creatorIds = useQueryRef({
      fromQuery: (query) => {
        const stringIds = arrayQuery(query.creatorId, {
          validator: (value) => /^[1-9]\d*$/.test(value)
        });
        return stringIds.length !== 0
          ? stringIds.map(id => Number.parseInt(id, 10))
          : (entityCreators.dataExists ? [...entityCreators.ids] : []);
      },
      toQuery: (value) => ({
        creatorId: value.length === entityCreators.length
          ? []
          : value.map(id => id.toString())
      })
    });
    watch(() => entityCreators.dataExists, () => {
      if (creatorIds.value.length === 0 && entityCreators.length !== 0)
        creatorIds.value = [...entityCreators.ids];
    });

    const creationDateRange = useDateRangeQueryRef();
    const { dataView, options: viewOptions } = useDataView();

    const { request } = useRequest();

    return {
      dataset, deletedEntityCount, odataEntities, entityCreators,
      searchTerm, creatorIds, creationDateRange, conflict,
      dataView, viewOptions,
      request
    };
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

      deleteModal: modalData(),

      // state that indicates whether we need to show restore confirmation dialog
      confirmRestore: true,
      restoreModal: modalData(),

      awaitingResponses: new Set(),

      snapshotFilter: '',
      // used for restoring them back when undo button is pressed
      bulkDeletedEntities: [],
      selectedEntities: new Set(),
      bulkOperationInProgress: false,

      allSelected: false
    };
  },
  computed: {
    filtersOnCreatorId() {
      if (this.creatorIds.length === 0) return false;
      const selectedAll = this.entityCreators.dataExists &&
        this.creatorIds.length === this.entityCreators.length &&
        this.creatorIds.every(id => this.entityCreators.ids.has(id));
      return !selectedAll;
    },
    odataFilter() {
      const conditions = [];
      if (this.filtersOnCreatorId) {
        const condition = this.creatorIds
          .map(id => `__system/creatorId eq ${id}`)
          .join(' or ');
        conditions.push(`(${condition})`);
      }
      if (this.creationDateRange.length !== 0) {
        const start = this.creationDateRange[0].toISO();
        const end = this.creationDateRange[1].endOf('day').toISO();
        conditions.push(`__system/createdAt ge ${start}`);
        conditions.push(`__system/createdAt le ${end}`);
      }
      if (this.conflict.length === 1) {
        conditions.push(this.conflict[0] ? '__system/conflict ne null' : '__system/conflict eq null');
      }
      return conditions.length !== 0 ? conditions.join(' and ') : null;
    },
    geojsonFilter() {
      const query = {};
      if (this.filtersOnCreatorId) query.creatorId = this.creatorIds;
      if (this.creationDateRange.length !== 0) {
        query.start__gte = this.creationDateRange[0].toISO();
        query.end__lte = this.creationDateRange[1].endOf('day').toISO();
      }
      if (this.conflict.length === 1)
        query.conflict = this.conflict[0] ? ['soft', 'hard'] : 'null';
      return Object.keys(query).length !== 0 ? query : null;
    },
    emptyMessage() {
      if (!this.odataEntities.dataExists) return '';
      if (this.odataEntities.value.length > 0) return '';

      // Cases related to entity deletion
      if (this.odataEntities.removedEntities.size === this.odataEntities.count && this.odataEntities.count > 0) {
        return this.deleted ? this.$t('deletedEntity.allRestored') : this.$t('allDeleted');
      }
      if (this.odataEntities.removedEntities.size > 0 && this.odataEntities.value.length === 0) {
        return this.deleted ? this.$t('deletedEntity.allRestoredOnPage') : this.$t('allDeletedOnPage');
      }
      if (this.deleted) {
        return this.$t('deletedEntity.emptyTable');
      }

      if (this.odataFilter) return this.$t('noMatching');
      return this.dataView === 'table'
        ? this.$t('noEntities')
        : joinSentences(this.$i18n, [
          this.$t('common.emptyMap'),
          this.$t('emptyMap')
        ]);
    },
    actionBarState() {
      return this.selectedEntities.size > 0 && !this.alert.state && !this.container.openModal.state;
    }
  },
  watch: {
    'odataEntities.value': {
      handler() {
        this.clearSelectedEntities();
      }
    },
    'odataEntities.count': {
      handler() {
        if (this.dataset.dataExists && this.odataEntities.dataExists &&
          this.dataView === 'table' && !this.odataFilter && !this.deleted &&
          !this.searchTerm)
          this.dataset.entities = this.odataEntities.count;
      }
    },
    'selectedEntities.size': {
      handler(size) {
        if (size > 0) {
          this.alert.last.hide();
        }
      }
    },
    // Hide the action bar if any alert is raised.
    'alert.state': {
      handler(state) {
        if (!state) {
          // since alert is hidden, we no longer need to keep bulkDeletedEntities list as there is
          // no longer a way to undo bulk delete
          this.bulkDeletedEntities.length = 0;
        }
      }
    },
    actionBarState(state) {
      // only if all rows are unselected, this doesn't happen when a modal is shown
      if (!state && this.selectedEntities.size === 0) {
        this.allSelected = false;
      }
    }

  },
  created() {
    this.fetchCreators();
  },
  methods: {
    resetFilters() {
      this.$router.replace({ path: this.$route.path, query: {} });
    },
    refresh() {
      this.refreshing = true;
      this.$refs.view.fetchData(false)
        .then(() => { this.refreshing = false; });

      // emit event to parent component to re-fetch deleted Entity count
      if (!this.deleted) this.$emit('fetch-deleted-count');
    },
    // This method is called directly by DatasetEntities.
    reset() {
      if (this.odataFilter == null && !this.searchTerm) {
        this.$refs.view.fetchData();
      } else {
        this.resetFilters();
      }
    },
    fetchCreators() {
      this.entityCreators.request({
        url: apiPaths.entityCreators(this.projectId, this.datasetName)
      }).catch(noop);
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
        this.$refs.view.afterUpdate(index);
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

      this.$refs.view.afterUpdate(this.resolveIndex);
    },
    showDelete(entity) {
      this.deleteModal.show({ entity });
    },
    requestDelete(event) {
      const { __id: uuid, label } = event;

      this.awaitingResponses.add(uuid);

      this.request({
        method: 'DELETE',
        url: apiPaths.entity(this.projectId, this.datasetName, uuid),
        fulfillProblem: ({ code }) => code === 404.1
      })
        .then(() => {
          this.deleteModal.hide();
          if (this.deletedEntityCount.dataExists) this.deletedEntityCount.value += 1;

          this.alert.success(this.$t('alert.entityDeleted', { label }));

          this.odataEntities.removedEntities.add(uuid);
          this.dataset.entities -= 1;

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
            this.$refs.view.afterDelete(index);
            this.selectedEntities.delete(this.odataEntities.value[index]);
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
        url: apiPaths.entityRestore(this.projectId, this.datasetName, uuid),
        fulfillProblem: ({ code }) => code === 404.1
      })
        .then(() => {
          this.restoreModal.hide();
          if (this.deletedEntityCount.dataExists && this.deletedEntityCount.value > 0) {
            this.deletedEntityCount.value -= 1;
          }

          this.alert.success(this.$t('alert.entityRestored', { label }));
          if (confirm != null) this.confirmRestore = confirm;

          this.odataEntities.removedEntities.add(uuid);
          this.dataset.entities += 1;

          // See the comments in requestDelete().
          const index = this.odataEntities.dataExists
            ? this.odataEntities.value.findIndex(entity => entity.__id === uuid)
            : -1;
          if (index !== -1) {
            this.$refs.view.afterDelete(index);
            this.odataEntities.value.splice(index, 1);
          }
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(uuid);
        });
    },
    clearSelectedEntities() {
      this.selectedEntities.clear();
      this.odataEntities.value?.forEach(e => { e.__system.selected = false; });
      this.allSelected = false;
    },
    cancelBackgroundRefresh() {
      if (!this.refreshing) return;
      this.$refs.view.cancelFetch();
      this.deletedEntityCount.cancelRequest();
    },
    requestBulkDelete() {
      const uuids = Array.from(this.selectedEntities).map(e => e.__id);

      const bulkDelete = () => {
        this.bulkOperationInProgress = true;
        this.cancelBackgroundRefresh();
        return this.request({
          method: 'POST',
          url: apiPaths.entities(this.projectId, this.datasetName, '/bulk-delete'),
          alert: false,
          data: {
            ids: uuids
          }
        }).finally(() => {
          this.bulkOperationInProgress = false;
        });
      };

      const onSuccess = () => {
        if (this.deletedEntityCount.dataExists) this.deletedEntityCount.value += uuids.length;

        uuids.forEach(uuid => this.odataEntities.removedEntities.add(uuid));
        this.dataset.entities -= uuids.length;


        this.bulkDeletedEntities = [...this.selectedEntities];
        this.odataEntities.value = this.odataEntities.value.filter(e => !this.selectedEntities.has(e));
        this.alert.success(this.$tcn('alert.bulkDelete', this.selectedEntities.size))
          .cta(this.$t('action.undo'), () => this.requestBulkRestore(uuids));
        this.selectedEntities.clear();
      };

      bulkDelete()
        .then(onSuccess)
        .catch((error) => {
          const { cta } = this.alert.danger(requestAlertMessage(this.$i18n, error));
          cta(this.$t('action.tryAgain'), () => bulkDelete()
            .then(() => {
              onSuccess();
              return true;
            })
            .catch(noop));
        });
    },
    requestBulkRestore() {
      const uuids = this.bulkDeletedEntities.map(e => e.__id);
      const bulkRestore = () => {
        this.bulkOperationInProgress = true;
        this.cancelBackgroundRefresh();

        return this.request({
          method: 'POST',
          url: apiPaths.entities(this.projectId, this.datasetName, '/bulk-restore'),
          alert: false,
          data: {
            ids: uuids
          }
        }).finally(() => {
          this.bulkOperationInProgress = false;
        });
      };

      const onSuccess = () => {
        this.bulkDeletedEntities.forEach(e => {
          e.__system.selected = false;
        });
        const combined = [
          ...this.odataEntities.value,
          ...this.bulkDeletedEntities
        ];

        this.odataEntities.value = combined.sort((a, b) =>
          b.__system.rowNumber - a.__system.rowNumber);

        this.bulkDeletedEntities.length = 0;
        if (this.deletedEntityCount.dataExists) this.deletedEntityCount.value -= uuids.length;
        uuids.forEach(uuid => this.odataEntities.removedEntities.delete(uuid));
        this.dataset.entities += uuids.length;
        this.alert.success(this.$tcn('alert.restored', uuids.length));
      };

      bulkRestore()
        .then(onSuccess)
        .catch((error) => {
          const { cta } = this.alert.danger(requestAlertMessage(this.$i18n, error));
          cta(this.$t('action.tryAgain'), () => bulkRestore()
            .then(() => {
              onSuccess();
              return true;
            })
            .catch(noop));
        });
    },
    handleSelectionChange(entity, selected) {
      if (entity === 'all') {
        this.selectedEntities.clear();
        if (selected) {
          this.odataEntities.value.forEach(e => this.selectedEntities.add(e));
        }
      } else if (selected) {
        this.selectedEntities.add(entity);
      } else {
        this.selectedEntities.delete(entity);
      }
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

#entity-list .radio-field { margin-left: auto; }

#entity-table:has(tbody tr) + .empty-table-message {
  display: none;
}

// Hiding "Deleted Entities" button when bulk operation is in progress
// Doing this CSS trick to avoid more communication between DatasetEntities and EntityList
#dataset-entities:has(.bulk-operation-in-progress) .toggle-deleted-entities {
  display: none;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown when there are no Entities to show in a table.
    "noEntities": "There are no Entities to show.",
    "noMatching": "There are no matching Entities.",
    "emptyMap": "Entities only appear if they include data in the geometry property.",
    "allDeleted": "All Entities are deleted.",
    "allDeletedOnPage": "All Entities on the page have been deleted.",
    "alert": {
      "delete": "Entity “{label}” has been deleted.",
      "bulkDelete": "{count} Entity successfully deleted. | {count} Entities successfully deleted.",
      "restored": "{count} Entity successfully restored. | {count} Entities successfully restored.",
    },
    "filterDisabledMessage": "Filtering is unavailable for deleted Entities",
    "searchDisabledMessage": "Search is unavailable for deleted Entities",
    "mapDisabled": "Map is unavailable for deleted Entities",
    "downloadDisabled": "Download is unavailable for deleted Entities",
    "deletedEntity": {
      "emptyTable": "There are no deleted Entities.",
      "allRestored": "All deleted Entities are restored.",
      "allRestoredOnPage": "All Entities on the page have been restored."
    },
    "actionBar": {
      "message": "{count} Entity selected | {count} Entities selected"
    },
    "bulkOpInProgress": "Bulk operation in progress"
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
    "noEntities": "Es gibt keine Objekte zum Anzeigen.",
    "noMatching": "Es gibt keine passenden Objekte.",
    "allDeleted": "Alle Objekte werden gelöscht.",
    "allDeletedOnPage": "Alle Objekte auf der Seite wurden gelöscht.",
    "alert": {
      "delete": "Das Objekt \"{label}“ wurde gelöscht.",
      "bulkDelete": "{count} Objekt erfolgreich gelöscht. | {count} Objekte erfolgreich gelöscht.",
      "restored": "{count} Objekt erfolgreich wiederhergestellt. | {count} Objekte erfolgreich wiederhergestellt."
    },
    "filterDisabledMessage": "Filterung ist für gelöschte Objekte nicht verfügbar",
    "searchDisabledMessage": "Die Suche nach gelöschten Objekte ist nicht verfügbar",
    "downloadDisabled": "Der Download ist für gelöschte Objekte nicht verfügbar",
    "deletedEntity": {
      "emptyTable": "Es gibt keine gelöschten Objekte.",
      "allRestored": "Alle gelöschten Objekte werden wiederhergestellt.",
      "allRestoredOnPage": "Alle Objekte auf der Seite wurden wiederhergestellt."
    },
    "actionBar": {
      "message": "{count} Objekt ausgewählt | {count} Objekte ausgewählt"
    },
    "bulkOpInProgress": "Massenbearbeitung in Bearbeitung"
  },
  "es": {
    "noEntities": "No hay Entidades para mostrar.",
    "noMatching": "No hay entidades coincidentes.",
    "allDeleted": "Se eliminan todas las Entidades.",
    "allDeletedOnPage": "Se han eliminado todas las Entidades de la página.",
    "alert": {
      "delete": "Entidad “{label}” se ha eliminado.",
      "bulkDelete": "{count} Entidad eliminada correctamente. | {count} Entidades eliminadas correctamente. | {count} Entidades eliminadas correctamente.",
      "restored": "{count} Entidad restablecida correctamente. | {count} Entidades restablecidas correctamente. | {count} Entidades restablecidas correctamente."
    },
    "filterDisabledMessage": "El Filtro no está disponible para Entidades eliminadas",
    "searchDisabledMessage": "La búsqueda no está disponible para las entidades eliminadas",
    "downloadDisabled": "La descarga no está disponible para Entidades eliminadas",
    "deletedEntity": {
      "emptyTable": "No hay entidades eliminadas.",
      "allRestored": "Todas las Entidades eliminadas se restauran.",
      "allRestoredOnPage": "Se han restaurado todas las Entidades de la página."
    },
    "actionBar": {
      "message": "{count} Entidad seleccionada | {count} Entidades seleccionadas | {count} Entidades seleccionadas"
    },
    "bulkOpInProgress": "Operación masiva en curso"
  },
  "fr": {
    "noEntities": "Pas d'entités à montrer.",
    "noMatching": "Il n'y a pas d'Entités correspondantes",
    "allDeleted": "Toutes les Entités sont supprimées.",
    "allDeletedOnPage": "Toutes les Entités de la page ont été supprimées.",
    "alert": {
      "delete": "L'Entité \"{label}\" a été supprimée.",
      "bulkDelete": "{count} entité supprimée avec succès. | {count} entités supprimées avec succès. | {count} entités supprimées avec succès.",
      "restored": "{count} entité restaurée avec succès. | {count} entités restaurées avec succès. | {count} entités restaurées avec succès."
    },
    "filterDisabledMessage": "Le filtrage n'est pas disponible pour les entités supprimées.",
    "searchDisabledMessage": "La recherche n'est pas disponible pour les entités supprimées",
    "downloadDisabled": "Le téléchargement n'est pas disponible pour les entités supprimées.",
    "deletedEntity": {
      "emptyTable": "Il n'y a pas d'Entité supprimée.",
      "allRestored": "Toutes les Entités supprimées ont été restaurées.",
      "allRestoredOnPage": "Toutes les Entités de la page ont été restaurées."
    },
    "actionBar": {
      "message": "{count} entité sélectionnée | {count} entités sélectionnées | {count} entités sélectionnées"
    },
    "bulkOpInProgress": "Opération en masse en progrès"
  },
  "it": {
    "noEntities": "Non ci sono entità da mostrare.",
    "noMatching": "Non sono presenti Entità corrispondenti.",
    "allDeleted": "Tutte le entità vengono eliminate.",
    "allDeletedOnPage": "Tutte le entità della pagina sono state eliminate.",
    "alert": {
      "delete": "La Entità “{label}” è stata cancellata.",
      "bulkDelete": "{count} Entità è stata eliminata con successo | {count} Entità sono state eliminate con successo | {count} Entità sono state eliminate con successo",
      "restored": "{count} Entità è stata ripristinata con successo | {count} Entità sono state ripristinate con successo | {count} Entità sono state ripristinate con successo"
    },
    "filterDisabledMessage": "Il filtro non è disponibile per le Entità eliminate.",
    "searchDisabledMessage": "La ricerca non è disponibile per le entità eliminate",
    "downloadDisabled": "Il download non è disponibile per le Entità eliminate",
    "deletedEntity": {
      "emptyTable": "Non ci sono Entità cancellate.",
      "allRestored": "Tutte le entità eliminate vengono ripristinate.",
      "allRestoredOnPage": "Tutte le entità della pagina sono state ripristinate."
    },
    "actionBar": {
      "message": "{count} Entità selezionata | {count} Entità selezionate | {count} Entità selezionate"
    },
    "bulkOpInProgress": "Elaborazione di massa in corso"
  },
  "pt": {
    "noEntities": "Não há Entidades para mostrar.",
    "noMatching": "Não há Entidades correspondentes.",
    "allDeleted": "Todas as Entidades foram excluídas.",
    "allDeletedOnPage": "Todas as Entidades nesta página foram excluídas.",
    "alert": {
      "delete": "A Entidade \"{label}\" foi excluída.",
      "bulkDelete": "{count} Entidade apagada com sucesso. | {count} Entidades apagadas com sucesso. | {count} Entidades apagadas com sucesso.",
      "restored": "{count} Entidade recuperada com sucesso. | {count} Entidades recuperadas com sucesso. | {count} Entidades recuperadas com sucesso."
    },
    "filterDisabledMessage": "Não é possível filtrar Entidades excluídas",
    "searchDisabledMessage": "A busca não está disponível para Entidades excluídas.",
    "downloadDisabled": "Não é possível fazer download de Entidades excluídas",
    "deletedEntity": {
      "emptyTable": "Não há Entidades excluídas.",
      "allRestored": "Todas as Entidades excluídas foram recuperadas.",
      "allRestoredOnPage": "Todas as Entidades nesta página foram recuperadas."
    },
    "actionBar": {
      "message": "{count} Entidade selecionada | {count} Entidades selecionadas | {count} Entidades selecionadas"
    }
  },
  "sw": {
    "noEntities": "Hakuna Fomu za kuonyesha.",
    "noMatching": "Hakuna Huluki zinazolingana."
  },
  "zh": {
    "noEntities": "暂无实体可显示。",
    "noMatching": "没有匹配的实体。",
    "allDeleted": "所有实体已被删除。",
    "allDeletedOnPage": "本页所有实体已被删除。",
    "alert": {
      "delete": "实体“{label}”已被删除。",
      "bulkDelete": "{count}个实体已成功删除。",
      "restored": "{count}个实体已成功复原。"
    },
    "filterDisabledMessage": "筛选功能对已删除的实体不可用",
    "searchDisabledMessage": "搜索功能对已删除的实体不可用",
    "downloadDisabled": "下载功能对已删除的实体不可用",
    "deletedEntity": {
      "emptyTable": "没有已删除的实体。",
      "allRestored": "所有已删除的实体已复原。",
      "allRestoredOnPage": "本页所有实体已复原。"
    },
    "actionBar": {
      "message": "已选择{count}个实体"
    },
    "bulkOpInProgress": "批量操作执行中"
  },
  "zh-Hant": {
    "noEntities": "沒有可顯示的實體。",
    "noMatching": "無相符的實體。",
    "allDeleted": "所有實體都會被刪除。",
    "allDeletedOnPage": "頁面上的所有實體都已刪除。",
    "alert": {
      "delete": "實體「1{label}」已被刪除。",
      "bulkDelete": "已成功刪除{count}個實體。",
      "restored": "已成功還原{count}個實體。"
    },
    "filterDisabledMessage": "已刪除的實體無法使用篩選功能",
    "searchDisabledMessage": "已刪除的實體無法使用搜尋功能",
    "downloadDisabled": "已刪除的實體無法下載",
    "deletedEntity": {
      "emptyTable": "沒有已刪除的實體。",
      "allRestored": "所有已刪除的實體都會還原。",
      "allRestoredOnPage": "頁面上的所有實體都已還原。"
    },
    "actionBar": {
      "message": "已選取{count}個實體"
    },
    "bulkOpInProgress": "正在執行大量作業"
  }
}
</i18n>
