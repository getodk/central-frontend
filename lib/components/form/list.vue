<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <p v-if="forms.length === 0" id="form-list-empty-message">
    To get started, add a Form.
  </p>
  <table v-else id="form-list-table" class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Created by</th>
        <th>Last Modified</th>
        <th>Last Submission</th>
      </tr>
    </thead>
    <tbody>
      <form-row v-for="form of forms" :key="form.xmlFormId"
        :project-id="projectId" :form="form"/>
    </tbody>
  </table>
</template>

<script>
import FormRow from './row.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormList',
  components: { FormRow },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  computed: requestData(['forms'])
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#form-list-table {
  tbody td {
    vertical-align: middle;

    .form-list-form-name {
      color: unset;
      font-size: 30px;
      text-decoration: unset;

      .icon-angle-right {
        color: $color-accent-primary;
        font-size: 20px;
        margin-left: 3px;
        margin-right: 0;
        vertical-align: 2px;
      }
    }

    .form-list-form-id {
      font-size: 18px;
    }
  }
}
</style>
