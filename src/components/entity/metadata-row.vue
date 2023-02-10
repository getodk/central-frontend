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
    <!-- ^^^ EntityTable assumes that this element does not have a class
    binding. -->

    <td class="row-number">{{ $n(rowNumber, 'noGrouping') }}</td>
    <td class="submitter-name">
      <span v-tooltip.text>{{ entity.__system.creatorName }}</span>
    </td>
    <td><date-time :iso="entity.__system.createdAt"/></td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';

export default {
  name: 'EntityMetadataRow',
  components: { DateTime },
  props: {
    entity: {
      type: Object,
      required: true
    },
    rowNumber: {
      type: Number,
      required: true
    }
  },
  setup() {
  },
  computed: {
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.entity-metadata-row {
  transition: background-color 0.6s 6s;

  &.updated {
    background-color: #faf1cd;
    transition: none;
  }

  .row-number {
    color: #999;
    font-size: 11px;
    padding-top: 11px;
    text-align: right;
    vertical-align: middle;
  }

  .submitter-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .state-and-actions {
    min-width: 205px;
    position: relative;

    > .icon-angle-right {
      bottom: #{$padding-bottom-table-data + 1px};
      color: $color-accent-primary;
      font-size: 20px;
      // Using `position: absolute` rather than `float: right` so that the icon
      // does not increase the row's height.
      position: absolute;
      right: $padding-right-table-data;
    }
  }

  $edits-and-angle-width: 48px;
  .state {
    // Ensure that there is space for the edit count and angle icon if the
    // column exceeds its min width.
    margin-right: #{$edits-and-angle-width + 15px};

    .icon-comments { margin-right: $margin-right-icon; }
    .icon-circle-o, .icon-dot-circle-o, .icon-pencil, .icon-check-circle, .icon-times-circle {
      margin-left: 1px;
      margin-right: #{$margin-right-icon + 1px};
    }

    .icon-circle-o, .icon-comments { color: $color-warning; }
    .icon-dot-circle-o { color: #999; }
    .icon-pencil { color: #777; }
    .icon-check-circle { color: $color-success; }
    .icon-times-circle { color: $color-danger; }
  }

  .edits {
    color: #777;
    // Positioning from the left rather than the right so that the icon is
    // aligned across rows.
    left: calc(100% - #{$edits-and-angle-width + $padding-right-table-data});
    position: absolute;

    .icon-pencil { margin-right: 5px; }
  }

  .btn-group {
    // Setting the background color in case the edit button is disabled.
    background-color: $color-page-background;
    left: -1000px;
    position: absolute;
    top: 4px;
  }

  .btn {
    .icon-check { margin-right: -1px; }

    .icon-pencil {
      margin-left: 1px;
      margin-right: 0;
    }
  }

  .more-button {
    span:first-child { margin-right: 13px; }

    .icon-angle-right {
      font-size: 18px;
      position: absolute;
      right: $hpadding-btn;
      top: #{$padding-top-btn - 2px};
    }
  }
}

.entity-table-actions-trigger-hover tr:hover .btn-group,
.entity-table-actions-trigger-hover .data-hover .btn-group,
.entity-table-actions-trigger-focus .btn-group:focus-within {
  left: auto;
  right: $padding-right-table-data;
}
</style>
