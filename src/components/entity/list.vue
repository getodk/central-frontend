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
    <loading :state="dataset.initiallyLoading"/>
    <div id="entity-list-actions">
      <button id="entity-list-refresh-button" type="button"
            class="btn btn-default" :aria-disabled="refreshing"
            @click="fetchChunk(0, false)">
            <span class="icon-refresh"></span>{{ $t('action.refresh') }}
            <spinner :state="refreshing"/>
          </button>
      <a id="entity-download-button" type="button" class="btn btn-primary" :href="href">
        <span class="icon-arrow-circle-down"></span>{{ $t('action.download') }}
      </a>
    </div>
    <entity-table v-show="odataEntities.dataExists && odataEntities.value.length !== 0"
        ref="table" :properties="dataset.properties"/>
    <p v-show="odataEntities.dataExists && odataEntities.value.length === 0"
      class="empty-table-message">
      {{ $t('noEntities') }}
    </p>
    <div v-show="odataLoadingMessage != null" id="entity-list-message">
      <div id="entity-list-spinner-container">
        <spinner :state="odataLoadingMessage != null"/>
      </div>
      <div id="entity-list-message-text">{{ odataLoadingMessage }}</div>
    </div>
  </div>
</template>

<script>

import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import EntityTable from './table.vue';

import useEntities from '../../request-data/entities';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'EntityList',
  components: {
    Loading,
    Spinner,
    EntityTable
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
    top: {
      type: Function,
      default: (skip) => (skip < 1000 ? 250 : 1000)
    }
  },
  setup() {
    // The dataset request object is how we get access to the
    // dataset properties for the columns.
    const { dataset } = useRequestData();
    const odataEntities = useEntities();
    return { dataset, odataEntities };
  },
  data() {
    return {
      refreshing: false
    };
  },
  computed: {
    href() {
      return apiPaths.entities(this.projectId, this.datasetName);
    },
    odataLoadingMessage() {
      if (!this.odataEntities.awaitingResponse || this.refreshing) return null;
      return this.$t('loading');
    }
  },
  created() {
    this.fetchChunk(0, true);
  },
  methods: {
    fetchChunk(skip, clear) {
      this.refreshing = skip === 0 && !clear;
      this.odataEntities.request({
        url: apiPaths.odataEntities(
          this.projectId,
          this.datasetName,
          {
            // Don't include top and skip to
            // fetch all entity data
            //$top: this.top(skip),
            //$skip: skip,
            $count: true
          }
        ),
        clear,
        patch: skip === 0
          ? null
          : (response) => { this.odataEntities.addChunk(response.data); }
      })
        .finally(() => { this.refreshing = false; })
        .catch(noop);
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
  margin-right: 5px;
}
#entity-download-button {
  // The bottom margin is for if the download button wraps above the other
  // actions.
  margin-bottom: 10px;
  margin-left: auto;
}

#entity-list-message {
  margin-left: 28px;
  padding-bottom: 38px;
  position: relative;

  #entity-list-spinner-container {
    margin-right: 8px;
    position: absolute;
    top: 8px;
    width: 16px; // eventually probably better not to default spinner to center.
  }

  #entity-list-message-text {
    color: #555;
    font-size: 12px;
    padding-left: 24px;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      // This text is shown when loading Entities and the count is unknown.
      "loading": "Loading Entities…",
      "noEntities": "There are no Entities to show."
    }
  }
</i18n>
