<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

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
        <th>Name</th>
        <th>Published</th>
        <th>Definition</th>
      </tr>
    </thead>
    <tbody>
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
  computed: requestData(['formVersions'])
};
</script>

<style lang="scss">
#form-version-table {
  table-layout: fixed;

  th:nth-child(3) {
    width: 200px;
  }
}
</style>
