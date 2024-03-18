<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="entity-upload-table panel panel-simple">
    <div class="panel-heading"><h1 class="panel-title">{{ title }}</h1></div>
    <div class="panel-body">
      <div ref="container" class="table-container"
      :style="{ minHeight, maxHeight: px(maxHeight) }">
      <table class="table">
        <thead>
          <tr>
            <th><span class="sr-only">{{ $t('common.rowNumber') }}</span></th>
            <th>label</th>
            <th v-for="{ name } of dataset.properties" :key="name" v-tooltip.text>
              {{ name }}
            </th>
          </tr>
        </thead>
        <tbody v-if="entities != null && entities.length !== 0"
          :class="{ 'data-loading': awaitingResponse }">
          <tr v-for="(entity, entityIndex) of entities" :key="entityIndex">
            <td class="row-number">
              {{ $n(rowIndex + entityIndex + 1, 'noGrouping') }}
            </td>
            <td v-tooltip.text>{{ entity.label }}</td>
            <td v-for="{ name } of dataset.properties" :key="name" v-tooltip.text>
              {{ entity.data[name] }}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watchEffect } from 'vue';

import { px } from '../../../util/dom';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadTable'
});
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  entities: Array,
  rowIndex: Number,
  pageSize: {
    type: Number,
    required: true
  },
  awaitingResponse: Boolean,
  maxHeight: {
    type: Number,
    required: true
  }
});

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();

// Prevent the table container from shrinking on the last page.
const container = ref(null);
const minHeight = ref('auto');
watchEffect(() => {
  if (props.awaitingResponse) return;
  if (props.entities != null && props.entities.length !== 0 &&
    props.entities.length < props.pageSize) {
    nextTick(() => {
      const containerHeight = container.value.getBoundingClientRect().height;
      const firstRow = container.value.querySelector('tbody tr');
      const rowHeight = firstRow.getBoundingClientRect().height;
      minHeight.value = px(Math.min(
        containerHeight + rowHeight * (props.pageSize - props.entities.length),
        props.maxHeight
      ));
    });
  } else {
    minHeight.value = 'auto';
  }
});

const resizeLastColumn = () => {
  if (container.value.clientWidth === 0) return;

  // Undo previous resizing.
  const th = container.value.querySelector('th:last-child');
  th.style.width = '';

  // Ensure that the column is not obscured by the pop-ups.
  const popups = container.value.closest('.modal-body')
    .querySelector('#entity-uploads-popups');
  if (popups != null) {
    const popupsRect = popups.getBoundingClientRect();
    const containerRect = container.value.getBoundingClientRect();
    if (popupsRect.top > containerRect.bottom) {
      const overlap = containerRect.right - popupsRect.left;
      // Adding 10px for some extra space between the column and the pop-up.
      th.style.width = px(th.clientWidth + overlap + 10);
    }
  }

  // If the container fits the table without scrolling horizontally, then the
  // columns probably have room to grow. In that case, we allocate the extra
  // width to the last column rather than distributing it evenly among the
  // columns.
  if (container.value.scrollWidth === container.value.clientWidth)
    th.style.width = 'auto';
};
defineExpose({ resizeLastColumn });
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-upload-table {
  margin-bottom: $margin-bottom-table;
  &:has(tbody) { margin-bottom: 0; }

  .panel-heading {
    background-color: #ccc;
    border-bottom: none;
  }

  .panel-body { padding: 0; }
  .table-container { overflow: auto; }

  table {
    margin-bottom: 0;
    table-layout: fixed;
  }

  th, td { @include text-overflow-ellipsis; }

  th {
    width: 160px;
    // Wide enough to fit a 6-digit number.
    &:first-child { width: 54px; }
  }

  // Provide extra room for the row number in case it is large.
  td:first-child { padding-left: 0; }

  ~ .pagination { margin-left: $padding-left-table-data; }
}

.entity-upload-table ~ .entity-upload-table {
  margin-top: 12px;

  .panel-heading {
    background-color: $color-action-background;
    color: #fff;
  }

  thead { background-color: #c5dfe7; }
}
</style>
