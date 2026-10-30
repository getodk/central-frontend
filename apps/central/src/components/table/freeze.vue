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
  <div class="table-freeze" :class="{ 'frozen-only': frozenOnly }">
    <table class="table table-freeze-frozen" :class="{ divider }">
      <thead>
        <tr>
          <slot name="head-frozen"></slot>
        </tr>
      </thead>
      <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events,vuejs-accessibility/click-events-have-key-events -->
      <tbody v-if="data != null" ref="frozenBody"
        :class="`actions-trigger-${actionsTrigger}`"
        @mousemove="setActionsTrigger('hover')" @mouseover="toggleHoverClass"
        @mouseleave="removeHoverClass" @focusin="setActionsTrigger('focus')"
        @click="rowClick">
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
        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events,vuejs-accessibility/click-events-have-key-events -->
        <tbody v-if="data != null" ref="scrollingBody"
          @mousemove="setActionsTrigger('hover')" @mouseover="toggleHoverClass"
          @mouseleave="removeHoverClass" @click="rowClick">
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
import { ref, watch } from 'vue';

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

// When hovering over a row of the either table, add a class to the
// row of the corresponding table. Note that the class may be overwritten
// if the <tr> element in the data-frozen slot uses v-bind:class.
const hoverRowIndex = ref(null);
const frozenBody = ref(null);
const scrollingBody = ref(null);
const toggleHoverClass = (event) => {
  const targetRow = event.target.closest('tr');
  if (hoverRowIndex.value != null) {
    if (targetRow.rowIndex - 1 === hoverRowIndex.value) return;
    frozenBody.value.rows[hoverRowIndex.value].classList.remove('hover');
    scrollingBody.value.rows[hoverRowIndex.value].classList.remove('hover');
  }
  hoverRowIndex.value = targetRow.rowIndex - 1;
  frozenBody.value.rows[hoverRowIndex.value].classList.add('hover');
  scrollingBody.value.rows[hoverRowIndex.value].classList.add('hover');
};
const removeHoverClass = () => {
  if (hoverRowIndex.value != null) {
    frozenBody.value.rows[hoverRowIndex.value].classList.remove('hover');
    scrollingBody.value.rows[hoverRowIndex.value].classList.remove('hover');
    hoverRowIndex.value = null;
  }
};
/*
We remove the scrolling-hover class after the table is refreshed, with the
following cases in mind:

  - There may be fewer rows after the refresh than before.
  - The rows may be reordered.
*/
watch(() => props.data, removeHoverClass);

const rowClick = (event) => {
  const action = event.target.closest('.btn-group .btn');
  const row = event.target.closest('tr');
  if (row == null) return;
  const index = row.rowIndex - 1;
  const target = action ?? row;
  emit('action', { target, data: props.data[index], index });
};
const getRowPair = (index) =>
  [frozenBody.value.rows[index], scrollingBody.value.rows[index]];
defineExpose({ getRowPair });

</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.table-freeze {
  @include clearfix;
  position: relative;
  border: 1px solid $color-border;
  border-radius: 12px;
  overflow: hidden;

  .table {
    border: none;
    border-radius: 0;
    margin-bottom: 0;

    tr.hover {
      background-color: $color-bg;
    }
  }
}

.table-freeze-frozen {
  float: left;
  width: auto;
}

.table-freeze-scrolling-container {
  overflow-x: auto;

  .table {
    width: 100%;
  }
}

.table-freeze-frozen.divider {
  th:last-child { border-right: $border-top-table-data;  }
  td:last-child { border-right: $border-top-table-data; }
}

// Styles related to actions (buttons and links). If there are actions, they
// should be in a .btn-group.
.table-freeze-frozen {
  .btn-group {
    left: -2000px;
    // Relative to .table-freeze so that buttons are shown to the right side of the component.
    position: absolute;
    margin-top: 6px;
  }

  .actions-trigger-hover .hover .btn-group,
  .actions-trigger-focus .btn-group:focus-within {
    left: auto;
    right: 10px;
  }

  .col-actions {
    width: 0;
    padding: 0;
    vertical-align: top;
  }
}

</style>
