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
  <div ref="container" class="entity-upload-table"
    :class="{ 'overlaps-popups': overlapsPopups }" :style="{ minHeight }">
    <table class="table">
      <thead>
        <tr>
          <th><span class="sr-only">{{ $t('common.rowNumber') }}</span></th>
          <th>label</th>
          <th v-for="{ name } of dataset.properties" :key="name">
            <div v-tooltip.text>{{ name }}</div>
          </th>
        </tr>
      </thead>
      <tbody v-if="entities != null && entities.length !== 0"
        :class="{ 'data-loading': awaitingResponse }">
        <tr v-for="(entity, entityIndex) in entities" :key="entityIndex">
          <td class="row-number">
            {{ $n(rowIndex + entityIndex + 1, 'noGrouping') }}
          </td>
          <td><div v-tooltip.text>{{ entity.label }}</div></td>
          <td v-for="{ name } of dataset.properties" :key="name">
            <div v-tooltip.text>{{ entity.data[name] }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

import { px } from '../../../util/dom';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadTable'
});
const props = defineProps({
  entities: Array,
  // The 0-indexed row number of the first row of the table
  rowIndex: Number,
  pageSize: {
    type: Number,
    required: true
  },
  awaitingResponse: Boolean
});

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();

// The table container
const container = ref(null);

// Prevent the table container from shrinking on the last page.
const minHeight = ref('auto');
// The page size and height of the last full page that was rendered
const lastFullPage = { size: 0, height: 0 };
watch(() => props.entities, () => {
  if (props.entities == null) {
    minHeight.value = 'auto';
    Object.assign(lastFullPage, { size: 0, height: 0 });
  } else if (props.entities.length === props.pageSize) {
    minHeight.value = 'auto';
    nextTick(() => {
      lastFullPage.size = props.pageSize;
      lastFullPage.height = container.value.getBoundingClientRect().height;
    });
  } else if (props.pageSize === lastFullPage.size) {
    minHeight.value = px(lastFullPage.height);
  }
});

const overlapsPopups = ref(false);
const resizeLastColumn = () => {
  // Undo previous resizing.
  const th = container.value.querySelector('th:last-child');
  th.style.width = '';

  if (container.value.clientWidth === 0) {
    overlapsPopups.value = false;
    return;
  }

  // Check whether the column is obscured by the pop-ups.
  const popups = container.value.closest('.modal-body')
    .querySelector('#entity-upload-popups');
  if (popups != null) {
    const popupsRect = popups.getBoundingClientRect();
    const containerRect = container.value.getBoundingClientRect();
    overlapsPopups.value = popupsRect.top < containerRect.bottom;
    if (overlapsPopups.value) {
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

const resetScroll = () => { container.value.scroll(0, 0); };

defineExpose({ resizeLastColumn, resetScroll });
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-upload-table {
  overflow: auto;

  table {
    margin-bottom: 0;
    table-layout: fixed;
  }

  $col-width: 160px;
  th, td {
    div { @include text-overflow-ellipsis; }
  }
  &.overlaps-popups {
    th, td {
      &:last-child div {
        width: #{$col-width - $padding-left-table-data - $padding-right-table-data};
      }
    }
  }

  th {
    width: $col-width;
    // Wide enough to fit a 6-digit number.
    &:first-child { width: 54px; }
  }

  // Provide extra room for the row number in case it is large.
  td:first-child { padding-left: 0; }
}
</style>
