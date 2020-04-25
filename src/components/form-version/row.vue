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
  <tr>
    <td class="form-version-row-version">
      <span :title="version.versionOrBlank()">
        {{ version.versionOrBlank() }}
      </span>
    </td>
    <td>
      <div><date-time :iso="version.publishedAt"/></div>
      <div v-if="version.publishedBy != null"
        class="form-version-row-published-by"
        :title="version.publishedBy.displayName">
        <router-link v-if="canRoute(publishedByPath)" :to="publishedByPath">
          {{ version.publishedBy.displayName }}
        </router-link>
        <template v-else>
          {{ version.publishedBy.displayName }}
        </template>
      </div>
    </td>
    <td><form-version-standard-buttons :version="version"/></td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import Form from '../../presenters/form';
import FormVersionStandardButtons from './standard-buttons.vue';
import routes from '../../mixins/routes';

export default {
  name: 'FormVersionRow',
  components: { DateTime, FormVersionStandardButtons },
  mixins: [routes()],
  props: {
    version: {
      type: Form,
      required: true
    }
  },
  computed: {
    publishedByPath() {
      return this.userPath(this.version.publishedBy.id);
    }
  }
};
</script>

<style lang="scss">
.form-version-row-version, .form-version-row-published-by {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
