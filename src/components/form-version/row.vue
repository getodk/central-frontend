<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="form-version-row">
    <td class="version">
      <div>
        <div><form-version-string :version="version.version"/></div>
        <div v-if="current"><span class="chip">{{ $t('current') }}</span></div>
      </div>
    </td>
    <td>
      <time-and-user :iso="version.publishedAt" :user="version.publishedBy"/>
    </td>
    <td>
      <form-version-def-dropdown :version="version"
        @view-xml="$emit('view-xml')"/>
    </td>
  </tr>
</template>

<script setup>
import FormVersionDefDropdown from './def-dropdown.vue';
import FormVersionString from './string.vue';
import TimeAndUser from '../time-and-user.vue';

defineOptions({
  name: 'FormVersionRow'
});
defineProps({
  version: {
    type: Object,
    required: true
  },
  current: Boolean
});
defineEmits(['view-xml']);
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-version-row {
  .table tbody & td { vertical-align: middle; }

  .version > div {
    column-gap: 15px;
    display: flex;

    > :first-child {
      @include text-overflow-ellipsis;
      // This is needed to prevent overflow when the flexbox only has one child.
      max-width: 100%;
    }

    > :last-child { flex-shrink: 0; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a label shown for the current version of a Form.
    "current": "Current Published Version"
  }
}
</i18n>
