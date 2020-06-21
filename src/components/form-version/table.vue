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
  <table id="form-version-table" class="table">
    <thead>
      <tr>
        <th>{{ $t('header.name') }}</th>
        <th>{{ $t('header.published') }}</th>
        <th>{{ $t('header.definition') }}</th>
      </tr>
    </thead>
    <tbody v-if="formVersions != null">
      <form-version-row v-for="version of formVersions" :key="version.version"
        :version="version"/>
    </tbody>
  </table>
</template>

<script>
import FormVersionRow from './row.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormVersionTable',
  components: { FormVersionRow },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['formVersions'])
};
</script>

<style lang="scss">
#form-version-table {
  table-layout: fixed;

  th:nth-child(3) {
    width: 210px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      // This is the text of a table column header. The column shows who
      // published the version of the Form, as well as when they did so.
      "published": "Published",
      // This is the text of a table column header. "Definition" refers to a
      // Form definition.
      "definition": "Definition"
    }
  }
}
</i18n>
