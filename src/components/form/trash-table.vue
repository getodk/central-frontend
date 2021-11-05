<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <h1>Trash</h1>
    <table v-if="project != null" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.name') }}</th>
          <th v-if="columns.has('idAndVersion')">
            {{ $t('header.idAndVersion') }}
          </th>
          <th v-if="columns.has('submissions')">
            {{ $t('resource.submissions') }}
          </th>
          <th v-if="columns.has('actions')">{{ $t('header.actions') }}</th>
        </tr>
      </thead>
      <tbody v-if="deleted-forms != null">
        <deleted-form-row v-for="form of deletedForms" :key="form.xmlFormId" :form="form"
          :columns="columns"/>
      </tbody>
    </table>
  </div>
</template>

<script>
import DeletedFormRow from './trash-row.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'DeletedFormTable',
  components: { DeletedFormRow },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project', 'deletedForms']),
    columns() {
      const columns = new Set(['name']);
      // Hide columns from a project viewer.
      if (this.project.permits('project.update') ||
        this.project.permits('submission.create'))
        columns.add('idAndVersion').add('actions');
      // Hide the Submissions column from a Data Collector.
      if (this.project.permits('submission.list')) columns.add('submissions');
      return columns;
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "header": {
      // This is the text of a column header in a table of Forms. The column
      // shows the ID of each Form, as well as the name of its primary version.
      "idAndVersion": "ID and Version"
    }
  }
}
</i18n>
