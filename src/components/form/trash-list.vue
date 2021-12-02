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
      <tbody v-if="deletedForms != null">
        <deleted-form-row v-for="form of deletedForms" :key="form.hash" :form="form"
          :columns="columns" @start-restore="showRestore"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['deletedForms'])"/>
    <form-restore :state="restoreForm.state" :form="restoreForm.form" @hide="hideRestore" @success="afterRestore"/>
  </div>
</template>

<script>
import DeletedFormRow from './trash-row.vue';
import Loading from '../loading.vue';
import { requestData } from '../../store/modules/request';
import FormRestore from './restore.vue';

import modal from '../../mixins/modal';

export default {
  name: 'FormTrashList',
  components: { DeletedFormRow, FormRestore, Loading },
  mixins: [modal()],
  data() {
    return {
      restoreForm: {
        state: false,
        form: null
      }
    };
  },
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
  },
  methods: {
    showRestore(form) {
      this.restoreForm.form = form;
      this.showModal('restoreForm');
    },
    hideRestore() {
      this.restoreForm.form = null;
      this.hideModal('restoreForm');
    },
    afterRestore() {
      this.hideRestore();
      this.$emit('restore');
      this.$alert().success(this.$t('alert.restore', { name: 'TODO: pass this through' }));
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
    },
    "alert": {
      "restore": "The Form “{name}” has been undeleted"
    }
  }
}
</i18n>
