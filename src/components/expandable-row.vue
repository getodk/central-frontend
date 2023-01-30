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
  <div class="expandable-row">
    <div class="title-cell">
      <slot name="title"></slot>
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="caption-cell" @click="toggleExpanded">
      <slot name="caption"></slot>
    </div>

    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="button-cell" @click="toggleExpanded">
      <button type="button" class="btn btn-link">
        <span v-if="!expanded" class="sr-only">{{ $t('action.expand') }}</span>
        <span v-else class="sr-only">{{ $t('action.collapse') }}</span>
        <span v-if="!expanded" class="icon-caret-left"></span>
        <span v-else class="icon-caret-down"></span>
      </button>
    </div>
    <div v-show="expanded" class="expanded-row">
        <slot name="details"></slot>
    </div>
  </div>
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
  display: flex;
  flex-wrap: wrap;

  &> div {
    padding: 8px 0;
  }

  .title-cell {
    flex-grow: 1;
  }

  .caption-cell, .button-cell { cursor: pointer; }

  .caption-cell {
    text-align: right;
    flex-grow: 1;
  }

  .button-cell {
    align-self: center;
    text-align: center;
    padding: 0px;
    width: 30px;

    button {
      padding: 0;

      @include text-link;
    }
  }

  .expanded-row{
    width: 100%;
    padding: 0 8px 16px 8px;
  }
}


</style>
