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
      <entity-actions :entity="entity" :awaiting-response="awaitingResponse"/>
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
import DateTime from '../date-time.vue';
import EntityActions from './actions.vue';
import Spinner from '../spinner.vue';

defineOptions({
  name: 'EntityMetadataRow'
});
defineProps({
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

    // Ensure that the column is wide enough that EntityActions does not wrap.
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
