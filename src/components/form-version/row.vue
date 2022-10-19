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
      <form-version-string :version="version.version"/>
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

<script>
import FormVersionDefDropdown from './def-dropdown.vue';
import FormVersionString from './string.vue';
import TimeAndUser from '../time-and-user.vue';

import routes from '../../mixins/routes';

export default {
  name: 'FormVersionRow',
  components: { FormVersionDefDropdown, FormVersionString, TimeAndUser },
  mixins: [routes()],
  props: {
    version: {
      type: Object,
      required: true
    }
  },
  emits: ['view-xml']
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-version-row {
  .table tbody & td { vertical-align: middle; }
  .version { @include text-overflow-ellipsis; }
}
</style>
