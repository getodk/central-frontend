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
  <tr class="entity-metadata-row">
    <td class="row-number">{{ $n(rowNumber, 'noGrouping') }}</td>
    <td class="creator-name">
      <span v-tooltip.text>{{ entity.__system.creatorName }}</span>
    </td>
    <td><date-time :iso="entity.__system.createdAt"/></td>
    <td>
      <div class="col-content">
        <date-time :iso="entity.__system.updatedAt" class="updated-at"/>
        <span class="updates">
          <template v-if="entity.__system.updates !== 0">
            <span class="icon-pencil"></span>
            <span>{{ $n(entity.__system.updates, 'default') }}</span>
          </template>
        </span>
        <span class="icon-angle-right"></span>
      </div>
      <div class="btn-group">
        <button v-if="canUpdate" type="button"
          class="update-button btn btn-default" :aria-label="updateLabel"
          v-tooltip.aria-label>
          <span class="icon-pencil"></span>
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
  </tr>
</template>

<script setup>
import { computed, inject } from 'vue';

import DateTime from '../date-time.vue';

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
  canUpdate: Boolean
});
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

.entity-metadata-row {
  // TODO: move .row-number to app.css
  .row-number {
    color: #999;
    font-size: 11px;
    padding-top: 11px;
    text-align: right;
    vertical-align: middle;
  }

  .creator-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .col-content {
    align-items: flex-start;
    display: flex;
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
  .col-content .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    margin-top: -1px;
  }
}
</style>
