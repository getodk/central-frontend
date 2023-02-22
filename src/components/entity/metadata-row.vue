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
    <td class="creator-name">
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

  .creator-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }
}
</style>
