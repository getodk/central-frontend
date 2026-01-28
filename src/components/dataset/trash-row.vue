<!--
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="dataset-trash-row">
    <td class="name">
      <span>{{ dataset.name }}</span>
    </td>
    <td class="entities">
      <span>{{ $n(dataset.entities, 'default') }}</span>
    </td>
    <td>
      <span> <date-time :iso="dataset.lastEntity"/> </span>
    </td>
    <td>
      <span> <date-time :iso="dataset.deletedAt"/> </span>
    </td>
    <td>
      <a class="btn btn-primary" :href="href">
        <span class="icon-download"></span>{{ $t('action.download') }}
      </a>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';

import { apiPaths } from '../../util/request';

export default {
  name: 'DatasetTrashRow',
  components: { DateTime },
  props: {
    dataset: {
      type: Object,
      required: true
    }
  },
  computed: {
    href() {
      // TODO: API might be different for the deleted dataset (SK)
      return apiPaths.entities(this.dataset.projectId, this.dataset.id, '.csv');
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.dataset-trash-row {
  .name {
    @include text-overflow-ellipsis;
    font-size: 18px;
   }
  .entities {
    text-align: right;
    padding-right: 10%;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "download": "Download data (.csv)"
    }
  }
}
</i18n>
