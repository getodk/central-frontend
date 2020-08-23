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
    <td class="version" :class="{ 'blank-version': version.version === '' }">
      <span :title="version.versionOrBlank()">
        {{ version.versionOrBlank() }}
      </span>
    </td>
    <td>
      <time-and-user :iso="version.publishedAt" :user="version.publishedBy"/>
    </td>
    <td><form-version-standard-buttons :version="version"/></td>
  </tr>
</template>

<script>
import Form from '../../presenters/form';
import FormVersionStandardButtons from './standard-buttons.vue';
import TimeAndUser from '../time-and-user.vue';
import routes from '../../mixins/routes';

export default {
  name: 'FormVersionRow',
  components: { FormVersionStandardButtons, TimeAndUser },
  mixins: [routes()],
  props: {
    version: {
      type: Form,
      required: true
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-version-row {
  .table tbody & td { vertical-align: middle; }

  .version {
    font-family: $font-family-monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .blank-version {
    font-family: inherit;
  }
}
</style>
