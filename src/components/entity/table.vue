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
  <div>
    <table id="entity-table-metadata" class="table table-frozen">
      <thead>
        <tr>
          <th><!-- Row number --></th>
          <th>{{ $t('header.createdBy') }}</th>
          <th>{{ $t('header.createdAt') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="odataEntities.dataExists">
          <entity-metadata-row v-for="(entity, index) in odataEntities.value"
            :key="entity.__name" :entity="entity"
            :row-number="odataEntities.value.length - index"
            :data-index="index"/>
        </template>
      </tbody>
    </table>
    <div class="table-container">
      <table id="entity-table-data" class="table">
        <thead>
          <tr v-if="properties != null">
            <th v-for="property of properties" :key="property.id">
              <span v-tooltip.text>{{ property.name }}</span>
            </th>
            <th>{{ $t('header.label') }}</th>
            <th>{{ $t('header.entityId') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="odataEntities.dataExists && properties != null">
            <entity-data-row v-for="(entity, index) in odataEntities.value"
              :key="entity.name" :entity="entity"
              :properties="properties" :data-index="index"/>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import EntityDataRow from './data-row.vue';
import EntityMetadataRow from './metadata-row.vue';

import { useRequestData } from '../../request-data';


export default {
  name: 'EntityTable',
  components: { EntityDataRow, EntityMetadataRow },
  props: {
    properties: Array
  },
  emits: ['review'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, odataEntities } = useRequestData();
    return { project, odataEntities };
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-table-metadata {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  th:last-child { border-right: $border-bottom-table-heading; }
  td:last-child { border-right: $border-top-table-data; }
}

#entity-table-data {
  width: auto;

  th, td {
    @include text-overflow-ellipsis;
    max-width: 250px;
    &:last-child { max-width: 325px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      "createdBy": "Created by",
      "createdAt": "Created at",
      "label": "Label",
      "entityId": "Entity ID"
    }
  }
}
</i18n>
