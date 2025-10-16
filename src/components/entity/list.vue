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
          :disabled="deleted" :disabled-message="deleted ? $t('filterDisabledMessage') : null"/>
        </form>
        <teleport-if-exists v-if="odataEntities.dataExists" to=".dataset-entities-heading-row">
          <entity-download-button :odata-filter="deleted ? null : odataFilter"
          :search-term="deleted ? null : searchTerm"
          :disabled="deleted"
          v-tooltip.aria-describedby="deleted ? $t('downloadDisabled') : null"/>
        </teleport-if-exists>
      </div>
      <table-refresh-bar :odata="odataEntities" :disabled="refreshing"
        :refreshing="refreshing" @refresh-click="fetchChunk(false, true)"/>
      <entity-table v-show="odataEntities.dataExists" ref="table"
        v-model:all-selected="allSelected"
        :properties="dataset.properties" :deleted="deleted"
        :awaiting-deleted-responses="awaitingResponses"
        @selection-changed="handleSelectionChange"
        @update="showUpdate"
        @resolve="showResolve" @delete="showDelete" @restore="showRestore"/>

      <p v-show="emptyTableMessage" class="empty-table-message">
        {{ emptyTableMessage }}
      </p>
      <odata-loading-message :state="odataEntities.initiallyLoading"
        type="entity"
        :top="pagination.size"
        :filter="odataFilter != null || !!searchTerm"
        :total-count="dataset.dataExists ? dataset.entities : 0"/>

      <!-- @update:page is emitted on size change as well -->
      <pagination v-if="pagination.count > 0"
              v-model:page="pagination.page" v-model:size="pagination.size"
              :count="pagination.count" :size-options="pageSizeOptions"
              :spinner="odataEntities.awaitingResponse"
              @update:page="handlePageChange()"/>
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
import { reactive, watch } from 'vue';

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
import SearchTextbox from '../search-textbox.vue';
import ActionBar from '../action-bar.vue';
import DisableContainer from '../disable-container.vue';
import TableRefreshBar from '../table-refresh-bar.vue';

import useQueryRef from '../../composables/query-ref';
import useDateRangeQueryRef from '../../composables/date-range-query-ref';
import useRequest from '../../composables/request';
import { apiPaths, requestAlertMessage } from '../../util/request';
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
    EntityRestore,
    EntityFilters,
    EntityResolve,
    EntityTable,
    EntityUpdate,
    OdataLoadingMessage,
    Pagination,
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

    const { request } = useRequest();

    const pageSizeOptions = [250, 500, 1000];

    return {
      dataset, odataEntities, conflict, request,
      deletedEntityCount, pageSizeOptions, searchTerm, entityCreators, creatorIds,
      creationDateRange
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

      pagination: { page: 0, size: this.pageSizeOptions[0], count: 0 },
      now: new Date().toISOString(),
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
    },
    actionBarState() {
      return this.selectedEntities.size > 0 && !this.alert.state && !this.container.openModal.state;
    }
  },
  watch: {
    deleted() {
      this.fetchChunk(true);
    },
    'odataEntities.value': {
      handler() {
        this.clearSelectedEntities();
      }
    },
    'odataEntities.count': {
      handler() {
        if (this.dataset.dataExists && this.odataEntities.dataExists && !this.odataFilter && !this.deleted && !this.searchTerm)
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
    this.fetchChunk(true);
    this.$watch(() => [this.odataFilter, this.searchTerm], () => this.fetchChunk(true));
    this.fetchCreators();
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

      this.clearSelectedEntities();

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
            this.$refs.table.afterDelete(index);
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
    clearSelectedEntities() {
      this.selectedEntities.clear();
      this.odataEntities.value?.forEach(e => { e.__system.selected = false; });
      this.allSelected = false;
    },
    cancelBackgroundRefresh() {
      if (!this.refreshing) return;
      this.odataEntities.cancelRequest();
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

#entity-list table:has(tbody:empty) {
    display: none;
  }

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
    "allDeleted": "All Entities are deleted.",
    "allDeletedOnPage": "All Entities on the page have been deleted.",
    "alert": {
      "delete": "Entity “{label}” has been deleted.",
      "bulkDelete": "{count} Entity successfully deleted. | {count} Entities successfully deleted.",
      "restored": "{count} Entity successfully restored. | {count} Entities successfully restored.",
    },
    "filterDisabledMessage": "Filtering is unavailable for deleted Entities",
    "searchDisabledMessage": "Search is unavailable for deleted Entities",
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
    "searchDisabledMessage": "La búsqueda no está disponible para las entidades eliminadas",
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
    "searchDisabledMessage": "La recherche n'est pas disponible pour les entités supprimées",
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
    "searchDisabledMessage": "La ricerca non è disponibile per le entità eliminate",
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
    "allDeleted": "Todas as Entidades foram excluídas.",
    "allDeletedOnPage": "Todas as Entidades nesta página foram excluídas.",
    "alert": {
      "delete": "A Entidade \"{label}\" foi excluída."
    },
    "filterDisabledMessage": "Não é possível filtrar Entidades excluídas",
    "downloadDisabled": "Não é possível fazer download de Entidades excluídas",
    "deletedEntity": {
      "emptyTable": "Não há Entidades excluídas.",
      "allRestored": "Todas as Entidades excluídas foram recuperadas.",
      "allRestoredOnPage": "Todas as Entidades nesta página foram recuperadas."
    }
  },
  "sw": {
    "noEntities": "Hakuna Fomu za kuonyesha.",
    "noMatching": "Hakuna Huluki zinazolingana."
  },
  "zh-Hant": {
    "noEntities": "沒有可顯示的實體。",
    "noMatching": "無相符的實體。",
    "allDeleted": "所有實體都會被刪除。",
    "allDeletedOnPage": "頁面上的所有實體都已刪除。",
    "alert": {
      "delete": "實體「1{label}」已被刪除。"
    },
    "filterDisabledMessage": "已刪除的實體無法使用篩選功能",
    "searchDisabledMessage": "已刪除的實體無法使用搜尋功能",
    "downloadDisabled": "已刪除的實體無法下載",
    "deletedEntity": {
      "emptyTable": "沒有已刪除的實體。",
      "allRestored": "所有已刪除的實體都會還原。",
      "allRestoredOnPage": "頁面上的所有實體都已還原。"
    }
  }
}
</i18n>
