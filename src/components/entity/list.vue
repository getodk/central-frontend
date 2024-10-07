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
    <div id="entity-list-actions">
      <form class="form-inline" @submit.prevent>
        <entity-filters v-model:conflict="conflict"/>
        <button id="entity-list-refresh-button" type="button"
          class="btn btn-default" :aria-disabled="refreshing"
          @click="fetchChunk(false, true)">
          <span class="icon-refresh"></span>{{ $t('action.refresh') }}
          <spinner :state="refreshing"/>
        </button>
      </form>
      <entity-download-button :odata-filter="odataFilter"/>
    </div>
    <entity-table v-show="showsTable" ref="table"
      :properties="dataset.properties" @update="showUpdate"
      @resolve="showResolve" @delete="showDelete"/>
    <p v-show="showsEmptyMessage" class="empty-table-message">
      {{ odataFilter == null ? $t('noEntities') : $t('noMatching') }}
    </p>
    <odata-loading-message type="entity"
      :top="top(odataEntities.dataExists ? odataEntities.value.length : 0)"
      :odata="odataEntities"
      :filter="odataFilter != null"
      :refreshing="refreshing"
      :total-count="dataset.dataExists ? dataset.entities : 0"/>

    <entity-update v-bind="update" @hide="hideUpdate" @success="afterUpdate"/>
    <entity-resolve v-bind="resolve" @hide="hideResolve" @success="afterResolve"/>
    <entity-delete v-bind="del" checkbox @hide="hideDelete"
      @delete="requestDelete(uuidToDelete, del.label, $event)"/>
  </div>
</template>

<script>
import { watchEffect } from 'vue';

import EntityDelete from './delete.vue';
import EntityDownloadButton from './download-button.vue';
import EntityFilters from './filters.vue';
import EntityTable from './table.vue';
import EntityUpdate from './update.vue';
import EntityResolve from './resolve.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import Spinner from '../spinner.vue';

import useEntities from '../../request-data/entities';
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
    EntityFilters,
    EntityTable,
    EntityUpdate,
    OdataLoadingMessage,
    Spinner,
    EntityResolve
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
    },
    // Returns the value of the $top query parameter.
    top: {
      type: Function,
      default: (loaded) => (loaded < 1000 ? 250 : 1000)
    }
  },
  setup() {
    // The dataset request object is how we get access to the
    // dataset properties for the columns.
    const { dataset } = useRequestData();
    const odataEntities = useEntities();
    // We do not reconcile `odataEntities` with either dataset.lastEntity or
    // project.lastEntity.
    watchEffect(() => {
      if (dataset.dataExists && odataEntities.dataExists &&
        !odataEntities.filtered)
        dataset.entities = odataEntities.count;
    });

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

    const { request } = useRequest();

    return { dataset, odataEntities, conflict, request };
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

      confirmDelete: true,
      uuidToDelete: null,
      del: modalData()
    };
  },
  computed: {
    odataFilter() {
      return this.conflict.length === 2
        ? null
        : (this.conflict[0] ? '__system/conflict ne null' : '__system/conflict eq null');
    },
    showsTable() {
      if (!this.odataEntities.dataExists) return false;
      const { length } = this.odataEntities.value;
      return length !== 0 && length !== this.odataEntities.deletedCount;
    },
    showsEmptyMessage() {
      // If there are more entities to fetch, then we don't show the message
      // even if all entities on the page are deleted. That case is pretty
      // unlikely though, because the user would have had to delete 250+
      // entities.
      return this.odataEntities.dataExists && !this.showsTable &&
        this.odataEntities.nextLink == null;
    }
  },
  watch: {
    odataFilter() {
      this.fetchChunk(true);
    }
  },
  created() {
    this.fetchChunk(true);
  },
  mounted() {
    document.addEventListener('scroll', this.afterScroll);
  },
  beforeUnmount() {
    document.removeEventListener('scroll', this.afterScroll);
  },
  methods: {
    // `clear` indicates whether this.odataEntities should be cleared before
    // sending the request. `refresh` indicates whether the request is a
    // background refresh (whether the refresh button was pressed).
    fetchChunk(clear, refresh = false) {
      this.refreshing = refresh;
      // Are we fetching the first chunk of entities or the next chunk?
      const first = clear || refresh;
      this.odataEntities.request({
        url: apiPaths.odataEntities(
          this.projectId,
          this.datasetName,
          {
            $top: this.top(first ? 0 : this.odataEntities.value.length),
            $count: true,
            $filter: this.odataFilter,
            $skiptoken: !first ? new URL(this.odataEntities.nextLink).searchParams.get('$skiptoken') : null
          }
        ),
        clear,
        patch: !first
          ? (response) => this.odataEntities.addChunk(response.data)
          : null
      })
        .finally(() => { this.refreshing = false; })
        .catch(noop);
    },
    // This method is called directly by DatasetEntities.
    reset() {
      if (this.odataFilter == null)
        this.fetchChunk(true);
      else
        // This change will cause the watcher on this.odataFilter to fetch
        // entities.
        this.conflict = [true, false];
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
    showDelete(index) {
      const entity = this.odataEntities.value[index];
      if (this.confirmDelete) {
        this.uuidToDelete = entity.__id;
        this.del.show({ label: entity.label });
      } else {
        this.requestDelete(entity.__id, entity.label);
      }
    },
    hideDelete() {
      this.del.hide();
      this.uuidToDelete = null;
    },
    requestDelete(uuid, label, confirm = undefined) {
      if (this.del.state) this.del.awaitingResponse = true;
      this.request({
        method: 'DELETE',
        url: apiPaths.entity(this.projectId, this.datasetName, uuid)
      })
        .then(() => {
          this.hideDelete();
          this.alert.success(this.$t('alert.delete', { label }));
          if (confirm != null) this.confirmDelete = confirm;

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
            this.odataEntities.countDeletion();
            this.$refs.table.afterDelete(index);
          }
        })
        .catch(() => { this.del.awaitingResponse = false; });
    },
    scrolledToBottom() {
      // Using pageYOffset rather than scrollY in order to support IE.
      return window.pageYOffset + window.innerHeight >=
        document.body.offsetHeight - 5;
    },
    afterScroll() {
      if (this.dataset.dataExists && this.odataEntities.dataExists &&
        this.odataEntities.nextLink &&
        !this.odataEntities.awaitingResponse && this.scrolledToBottom())
        this.fetchChunk(false);
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
  margin-left: 10px;
  margin-right: 5px;
}
#entity-download-button {
  // The bottom margin is for if the download button wraps above the other
  // actions.
  margin-bottom: 10px;
  margin-left: auto;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown when there are no Entities to show in a table.
    "noEntities": "There are no Entities to show.",
    "noMatching": "There are no matching Entities.",
    "alert": {
      "delete": "Entity “{label}” has been deleted."
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
    "alert": {
      "delete": "Die Entität \"{label}“ wurde gelöscht."
    }
  },
  "es": {
    "noEntities": "No hay Entidades para mostrar.",
    "noMatching": "No hay entidades coincidentes.",
    "alert": {
      "delete": "Entidad “{label}” se ha eliminado."
    }
  },
  "fr": {
    "noEntities": "Pas d'entités à montrer.",
    "noMatching": "Il n'y a pas d'Entités correspondantes",
    "alert": {
      "delete": "L'Entité \"{label}\" a été supprimée."
    }
  },
  "it": {
    "noEntities": "Non ci sono entità da mostrare.",
    "noMatching": "Non sono presenti Entità corrispondenti.",
    "alert": {
      "delete": "La Entità “{label}” è stata cancellata."
    }
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
