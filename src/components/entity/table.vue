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
        <template v-if="entities.dataExists">
          <entity-metadata-row v-for="(entity, index) in entities.value"
            :key="entity.__name" :entity="entity"
            :row-number="entities.value.length - index"
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
          <template v-if="entities.dataExists && properties != null">
            <entity-data-row v-for="(entity, index) in entities.value"
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

// We may render many rows, so this component makes use of event delegation and
// other optimizations.

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
    const { project, entities } = useRequestData();
    return { project, entities };
  },
  data() {
    return {
      /*
      Actions are shown for a row if the cursor is over the row or if one of the
      actions is focused. However, it is possible for the cursor to be over one
      row while an action is focused in a different row. In that case, we show
      the actions for one of the two rows depending on the type of the most
      recent event.

      I tried other approaches before landing on this one. However, sequences of
      events like the following were a challenge:

        - Click the More button for a row.
        - Next, press tab to focus the Review button in the next row.
        - Actions are shown for the next row and are no longer shown beneath the
          cursor. However, that will trigger a mouseover event, which depending
          on the approach may cause actions to be shown beneath the cursor
          again.
      */
      actionsTrigger: 'hover',
      dataHover: null
    };
  },
  computed: {
    canUpdate() {
      return this.project.dataExists && this.project.permits('entity.update');
    }
  },
  watch: {
    /*
    We remove the data-hover class after the entitys are refreshed, with the
    following cases in mind:

      - There may be fewer entitys after the refresh than before. In that
        case, it is possible that this.odata.value.length <= this.dataHover.
      - A entity may be in a different row after the refresh. For example,
        if the user hovers over the first row, and after the refresh, that
        entity is in the second row, then the second row will incorrectly
        have the data-hover class.

    In some cases, it would be ideal not to remove the class or to add the class
    to the row for a different entity. That logic is not in place right now.
    */
  },
  methods: {
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
      "createdBy": "Created By",
      "createdAt": "Created At",
      "label": "Label",
      "entityId": "Entity ID"
    }
  }
}
</i18n>
