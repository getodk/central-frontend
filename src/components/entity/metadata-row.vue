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
    <td class="row-number">
      <router-link v-slot="{ href }"
        :to="entityPath(projectId, datasetName, entity.__id)" custom>
        <a :href="href" target="_blank">{{ $n(rowNumber, 'noGrouping') }}</a>
      </router-link>
    </td>
    <td class="creator-name">
      <span v-tooltip.text>{{ entity.__system.creatorName }}</span>
    </td>
    <td><date-time :iso="entity.__system.createdAt"/></td>
  </tr>
</template>

<script>
export default {
  name: 'EntityMetadataRow'
};
</script>
<script setup>
import { inject } from 'vue';

import DateTime from '../date-time.vue';

import useRoutes from '../../composables/routes';

defineProps({
  entity: {
    type: Object,
    required: true
  },
  rowNumber: {
    type: Number,
    required: true
  }
});
const projectId = inject('projectId');
const datasetName = inject('datasetName');

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
}
</style>
