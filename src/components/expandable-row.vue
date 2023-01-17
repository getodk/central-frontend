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
  <tr class="expandable-row">
    <td>
      <slot name="title"></slot>
    </td>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
    <td role="button" class="caption-cell" @click.prevent="toggleExpanded">
      <slot name="caption"></slot>
    </td>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
    <td role="button" class="button-cell" @click.prevent="toggleExpanded">
      <span v-if="!expanded" class="icon-caret-left"></span>
      <span v-else class="icon-caret-down"></span>
    </td>
  </tr>
  <tr v-show="expanded" class="expanded-row">
    <td colspan="3">
      <slot name="details"></slot>
    </td>
  </tr>
</template>

<script>

export default {
  name: 'ExpandableRow',
  data() {
    return {
      expanded: false
    };
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded;
    }
  }
};

</script>

<style lang="scss">
@import '../assets/scss/_variables.scss';
@import '../assets/scss/mixins';

.expandable-row {
  .caption-cell {
    text-align: right;
  }
  .button-cell {
    width: 30px;
    margin-left: 5px;
    font-size: 20px;

    span {
      vertical-align: 1px;
    }
  }
}

.table > tbody > tr.expanded-row td{
  border-top: none;
  padding-top: 0px;
}

</style>
