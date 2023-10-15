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
    <entity-table v-show="odataEntities.dataExists && odataEntities.value.length !== 0"
      ref="table" :properties="dataset.properties" @update="showUpdate"/>
    <p v-show="odataEntities.dataExists && odataEntities.value.length === 0"
      class="empty-table-message">
      {{ odataFilter == null ? $t('noEntities') : $t('noMatching') }}
    </p>
    <odata-loading-message type="entity"
      :top="top(odataEntities.dataExists ? odataEntities.value.length : 0)"
      :odata="odataEntities"
      :filter="odataFilter != null"
      :refreshing="refreshing"
      :total-count="dataset.dataExists ? dataset.entities : 0"/>
    <entity-update v-bind="update" @hide="hideUpdate" @success="afterUpdate"/>
  </div>
</template>

<script>
import { watchEffect } from 'vue';

import EntityDownloadButton from './download-button.vue';
import EntityFilters from './filters.vue';
import EntityTable from './table.vue';
import EntityUpdate from './update.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import Spinner from '../spinner.vue';

import modal from '../../mixins/modal';
import useEntities from '../../request-data/entities';
import useQueryRef from '../../composables/query-ref';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'EntityList',
  components: {
    EntityDownloadButton,
    EntityFilters,
    EntityTable,
    EntityUpdate,
    OdataLoadingMessage,
    Spinner
  },
  mixins: [modal()],
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

    // Array of conflict statuses (`true` or `false`)
    const conflict = useQueryRef({
      fromQuery: (query) => (query.conflict === 'true'
        ? [true]
        : (query.conflict === 'false' ? [false] : [true, false])),
      toQuery: (value) => ({
        conflict: value.length === 2 ? null : value[0].toString()
      })
    });

    return { dataset, odataEntities, conflict };
  },
  data() {
    return {
      refreshing: false,
      // The index of the entity being updated
      updateIndex: null,
      // Data to pass to the update modal
      update: {
        state: false,
        entity: null
      }
    };
  },
  computed: {
    odataFilter() {
      return this.conflict.length === 2
        ? null
        : (this.conflict[0] ? '__system/conflict ne null' : '__system/conflict eq null');
    }
  },
  watch: {
    odataFilter() {
      return this.fetchChunk(true);
    }
  },
  created() {
    this.fetchData();
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
      // Are we fetching the first chunk of entities or the next chunk?
      const first = clear || refresh;
      // number of rows already loaded
      const loaded = this.odataEntities.dataExists ? this.odataEntities.value.length : 0;

      this.refreshing = refresh;

      this.odataEntities.request({
        url: apiPaths.odataEntities(
          this.projectId,
          this.datasetName,
          {
            $top: this.top(first ? 0 : loaded),
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
    fetchData() {
      this.fetchChunk(true);
    },
    showUpdate(index) {
      if (this.refreshing) return;
      this.updateIndex = index;
      const odataEntity = this.odataEntities.value[index];
      const data = Object.create(null);
      for (const { name, odataName } of this.dataset.properties)
        data[name] = odataEntity[odataName];
      this.update.entity = {
        uuid: odataEntity.__id,
        currentVersion: { label: odataEntity.label, version: odataEntity.__system.version, data }
      };
      this.showModal('update');
    },
    hideUpdate() {
      this.hideModal('update');
      this.update.entity = null;
      this.updateIndex = null;
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

      this.$refs.table.afterUpdate(index);
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
      "noMatching": "There are no matching Entities."
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noEntities": "Nejsou zde žádné subjekty, které by bylo možné zobrazit."
  },
  "de": {
    "action": {
      "download": {
        "unfiltered": "{count} Entität herunterladen | {count} Entitäten herunterladen"
      }
    },
    "noEntities": "Es gibt keine Entitäten zum Anzeigen."
  },
  "es": {
    "action": {
      "download": {
        "unfiltered": "Descargar {count} Entidad | Descargar {count} Entidades | Descargar {count} Entidades"
      }
    },
    "noEntities": "No hay Entidades para mostrar."
  },
  "fr": {
    "action": {
      "download": {
        "unfiltered": "Télécharger {count} entité | Télécharger {count} entités | Télécharger {count} entités"
      }
    },
    "noEntities": "Pas d'entités à montrer."
  },
  "id": {
    "action": {
      "download": {
        "unfiltered": "Unduh {count} Entitas"
      }
    }
  },
  "it": {
    "action": {
      "download": {
        "unfiltered": "Scarica {count} entità | Scarica {count} entità | Scarica {count} entità"
      }
    },
    "noEntities": "Non ci sono entità da mostrare."
  },
  "sw": {
    "action": {
      "download": {
        "unfiltered": "Pakua shirika {count} | Pakua Mashirika {count}"
      }
    },
    "noEntities": "Hakuna Fomu za kuonyesha."
  }
}
</i18n>
