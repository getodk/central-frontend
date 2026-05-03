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
  <div class="table-freeze">
    <table class="table table-freeze-frozen" :class="{ divider }">
      <thead>
        <tr>
          <slot name="head-frozen"></slot>
        </tr>
      </thead>
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <tbody v-if="data != null" ref="frozenBody"
        :class="`actions-trigger-${actionsTrigger}`"
        @mousemove="setActionsTrigger('hover')"
        @focusin="setActionsTrigger('focus')" @click="actionClick">
        <transition-group name="table-freeze-row">
          <slot v-for="(element, index) in data" :key="element[keyProp]"
            name="data-frozen" :data="element" :index="index">
          </slot>
        </transition-group>
      </tbody>
    </table>
    <div v-if="!frozenOnly" class="table-freeze-scrolling-container">
      <table class="table table-freeze-scrolling">
        <thead>
          <tr>
            <slot name="head-scrolling"></slot>
          </tr>
        </thead>
        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
        <tbody v-if="data != null" ref="scrollingBody"
          @mousemove="setActionsTrigger('hover')" @mouseover="toggleHoverClass"
          @mouseleave="removeHoverClass">
          <transition-group name="table-freeze-row">
            <slot v-for="(element, index) in data" :key="element[keyProp]"
              name="data-scrolling" :data="element" :index="index">
            </slot>
          </transition-group>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, watch } from 'vue';

// We may render many rows, so this component makes use of event delegation and
// other optimizations.

const props = defineProps({
  data: Array,
  keyProp: {
    type: String,
    required: true
  },
  frozenOnly: Boolean,
  divider: Boolean
});
const emit = defineEmits(['action']);

/*
Actions are shown for a row if the cursor is over the row or if one of the
actions is focused. However, it is possible for the cursor to be over one row
while an action is focused in a different row. In that case, we show the actions
for one of the two rows depending on the type of the most recent event.

I tried other approaches before landing on this one. However, some sequences of
events were a challenge. For example, in SubmissionTable:

  - Click the More button for a row.
  - Next, press tab to focus the Review button in the next row.
  - Actions are shown for the next row and are no longer shown beneath the
    cursor. However, that will trigger a mouseover event, which depending on the
    approach may cause actions to be shown beneath the cursor again.
*/
const actionsTrigger = ref('hover');
const setActionsTrigger = (trigger) => { actionsTrigger.value = trigger; };

// When hovering over a row of the scrolling table, add a class to the
// corresponding row of the frozen table. Note that the class may be overwritten
// if the <tr> element in the data-frozen slot uses v-bind:class.
const correspondingRow = shallowRef(null);
const frozenBody = ref(null);
const toggleHoverClass = (event) => {
  const scrollingRow = event.target.closest('tr');
  if (correspondingRow.value != null) {
    if (scrollingRow.rowIndex === correspondingRow.value.rowIndex) return;
    correspondingRow.value.classList.remove('scrolling-hover');
  }
  correspondingRow.value = frozenBody.value.rows[scrollingRow.rowIndex - 1];
  correspondingRow.value.classList.add('scrolling-hover');
};
const removeHoverClass = () => {
  if (correspondingRow.value != null) {
    correspondingRow.value.classList.remove('scrolling-hover');
    correspondingRow.value = null;
  }
};
/*
We remove the scrolling-hover class after the table is refreshed, with the
following cases in mind:

  - There may be fewer rows after the refresh than before.
  - The rows may be reordered.
*/
watch(() => props.data, removeHoverClass);

const actionClick = (event) => {
  const action = event.target.closest('.btn-group .btn');
  if (action != null) {
    const index = action.closest('tr').rowIndex - 1;
    emit('action', { target: action, data: props.data[index], index });
  }
};

const scrollingBody = ref(null);
const getRowPair = (index) =>
  [frozenBody.value.rows[index], scrollingBody.value.rows[index]];
defineExpose({ getRowPair });

</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.table-freeze { @include clearfix; }

.table-freeze-frozen {
  float: left;
  width: auto;
}

.table-freeze-scrolling-container {
  // Placing the margin here rather than on the table so that the horizontal
  // scrollbar appears immediately below the table, above the margin.
  margin-bottom: $margin-bottom-table;
  overflow-x: auto;

  .table {
    margin-bottom: 0;
    width: 100%;
  }
}

.table-freeze-frozen.divider {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  th:last-child { border-right: $border-bottom-table-heading; }
  td:last-child { border-right: $border-top-table-data; }
}

// Styles related to actions (buttons and links). If there are actions, they
// should be in a .btn-group.
.table-freeze-frozen {
  // If the table has a .btn-group, it will probably be in the last column.
  td:last-child { position: relative; }

  .btn-group {
    // Setting the background color in case an action is transparent.
    background-color: $color-page-background;
    left: -1000px;
    position: absolute;
    top: 4px;
  }

  .actions-trigger-hover tr:hover .btn-group,
  .actions-trigger-hover .scrolling-hover .btn-group,
  .actions-trigger-focus .btn-group:focus-within {
    left: auto;
    right: $padding-right-table-data;
  }

  .btn-group { @include icon-btn-group; }
}
</style>
