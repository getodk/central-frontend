<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-form-workflow-table">
    <table class="table">
      <thead>
        <tr>
          <th>Form</th>
          <th>
            State
            <button type="button" class="btn btn-link"
              @click="$emit('show-states')">
              <span class="icon-question-circle"></span>
            </button>
          </th>
          <template v-if="fieldKeys.length !== 0">
            <th>App User Access</th>
            <th v-for="fieldKey of fieldKeys" :key="fieldKey.id"
              class="text-ellipsis" :title="fieldKey.displayName">
              {{ fieldKey.displayName }}
            </th>
          </template>
        </tr>
      </thead>
      <tbody v-if="forms.length !== 0">
        <project-form-workflow-row v-for="form of forms" :key="form.xmlFormId"
          :form="form" :changes="changesByForm[form.xmlFormId]"
          @update:state="updateState" @update:access="updateAccess"/>
      </tbody>
    </table>
    <p v-if="forms.length === 0" class="empty-table-message">
      There are no Forms to show.
    </p>
  </div>
</template>

<script>
import ProjectFormWorkflowRow from './row.vue';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'ProjectFormWorkflowTable',
  components: { ProjectFormWorkflowRow },
  props: {
    changesByForm: {
      type: Object,
      required: true
    }
  },
  computed: requestData(['forms', 'fieldKeys']),
  methods: {
    updateState(form, state) {
      this.$emit('update:state', form, state);
    },
    updateAccess(form, fieldKey, accessible) {
      this.$emit('update:access', form, fieldKey, accessible);
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#project-form-workflow-table {
  .btn-link {
    padding: 0;
  }

  .icon-question-circle {
    margin-right: 0;
  }

  th, td {
    &:nth-child(2n + 5) {
      background-color: #eee;
    }
  }
}
</style>
