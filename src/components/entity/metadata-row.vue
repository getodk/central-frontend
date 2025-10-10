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
  <tr class="entity-metadata-row" :class="{ 'entity-row-selected': entity.__system.selected }">
    <td class="row-number">{{ $n(rowNumber, 'noGrouping') }}</td>
    <td v-if="!deleted && verbs.has('entity.delete')">
      <input type="checkbox" :aria-label="$t('action.selectRow')" :checked="entity.__system.selected" @change="$emit('selectionChanged', $event.target.checked)">
    </td>
    <td class="creator-name">
      <span v-tooltip.text>{{ entity.__system.creatorName }}</span>
    </td>
    <td><date-time :iso="entity.__system.createdAt"/></td>
    <td v-if="!deleted" class="action-cell">
      <div class="col-content">
        <date-time :iso="entity.__system.updatedAt" class="updated-at"/>
        <span class="updates">
          <template v-if="entity.__system.conflict">
            <span class="wrap-circle">
              <span class="icon-warning"></span>
            </span>
          </template>
          <template v-else-if="entity.__system.updates !== 0">
            <span class="icon-pencil"></span>
            <span>{{ $n(entity.__system.updates, 'default') }}</span>
          </template>
        </span>
        <span class="icon-angle-right"></span>
      </div>
      <div class="btn-group">
        <button v-if="verbs.has('entity.delete')" type="button"
          class="delete-button btn btn-default"
          :aria-label="$t('action.delete')" v-tooltip.aria-label>
          <span class="icon-trash"></span><spinner :state="awaitingResponse"/>
        </button>
        <button v-if="verbs.has('entity.update')" type="button"
          class="update-button btn btn-default" :aria-label="updateLabel"
          v-tooltip.aria-label>
          <span class="icon-pencil"></span>
        </button>
        <button v-if="entity.__system.conflict" type="button"
          class="resolve-button btn btn-danger" :aria-label="$t('action.reviewParallelUpdates')"
          v-tooltip.aria-label>
          <span class="icon-random"></span>
        </button>
        <router-link v-slot="{ href }"
          :to="entityPath(projectId, datasetName, entity.__id)" custom>
          <a class="more-button btn btn-default" :href="href" target="_blank">
            <span>{{ $t('action.more') }}</span>
            <span class="icon-angle-right"></span>
          </a>
        </router-link>
      </div>
    </td>
    <td v-else class="action-cell">
      <div class="col-content col-deleted-at">
        <date-time :iso="entity.__system.deletedAt"/>
      </div>
      <div v-if="verbs.has('entity.restore')" class="btn-group">
        <button type="button"
          class="restore-button btn btn-default"
          :aria-disabled="awaitingResponse"
          :aria-label="$t('action.restore')" v-tooltip.aria-label>
          <span class="icon-recycle"></span><spinner :state="awaitingResponse"/>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed, inject } from 'vue';

import DateTime from '../date-time.vue';
import Spinner from '../spinner.vue';

import useRoutes from '../../composables/routes';

defineOptions({
  name: 'EntityMetadataRow'
});
const props = defineProps({
  entity: {
    type: Object,
    required: true
  },
  rowNumber: {
    type: Number,
    required: true
  },
  verbs: {
    type: Set,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  awaitingResponse: Boolean
});
defineEmits(['selectionChanged']);
const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { i18n } = inject('container');
const updateLabel = computed(() => i18n.t('submission.action.edit', {
  count: i18n.n(props.entity.__system.updates, 'default')
}));

const { entityPath } = useRoutes();
</script>

<style lang="scss">
@import '../../assets/scss/mixins';
@import '../../assets/scss/variables';


.entity-row-selected {
  background-color: $color-selected-row;
}

.entity-metadata-row {
  .creator-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .action-cell {
    padding-top: 4px;
    padding-bottom: 4px;

    // Ensure that the column is wide enough that the .btn-group does not wrap.
    min-width: 170px;
    &:lang(id) { min-width: 215px; }
  }

  .col-content {
    align-items: flex-start;
    display: flex;
    margin-top: 3px;
  }
  .updated-at {
    margin-right: 21px;

    &:empty { width: 75px; }
  }
  .updates {
    color: #777;
    margin-left: auto;
    width: 41px;

    .icon-pencil { margin-right: 5px; }
  }
  .wrap-circle {
    width: 22px;
    display: inline-block;
    background: $color-danger;
    height: 22px;
    border-radius: 15px;
    text-align: center;
    color: white;

    margin-left: 8px;
  }
  .icon-warning { font-size: 12px; }
  .col-deleted-at { color: $color-danger; }
  // The actions themselves are styled via the icon-btn-group mixin.
}
</style>
