<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="dataset-settings">
    <div v-if="dataset.dataExists" class="panel panel-simple">
      <div class="panel-heading">
        <h1 class="panel-title">{{ $t('entityWorkflow') }}</h1>
      </div>
      <div class="panel-body">
        <form id="dataset-settings-form">
          <div class="radio" :class="{ disabled: dataset.awaitingResponse }">
            <label>
              <input v-model="approvalRequired" name="approvalRequired" type="radio" :value="false"
                aria-describedby="dataset-setting-on-receipt" :disabled="dataset.awaitingResponse" @change="update()">
              <strong>{{ $t('onReceipt.label') }}</strong>
            </label>
            <p id="dataset-setting-on-receipt" class="help-block">
              {{ $t('onReceipt.description') }}
            </p>
          </div>
          <div class="radio" :class="{ disabled: dataset.awaitingResponse }">
            <label>
              <input v-model="approvalRequired" name="approvalRequired" type="radio" :value="true"
                aria-describedby="dataset-setting-on-approval" :disabled="dataset.awaitingResponse" @change="update()">
              <strong>{{ $t('onApproval.label') }}</strong>
            </label>
            <p id="dataset-setting-on-approval" class="help-block">
              {{ $t('onApproval.description') }}
            </p>
          </div>
        </form>
      </div>
    </div>

    <dataset-pending-submissions v-bind="pendingSubmissionModal" @hide="hideAndReset" @success="hideAndUpdate"/>
  </div>
</template>

<script>
export default {
  name: 'DatasetSettings'
};
</script>

<script setup>
import { ref, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import DatasetPendingSubmissions from './pending-submissions.vue';

import { apiPaths, isProblem } from '../../util/request';
import { useRequestData } from '../../request-data';

const { t } = useI18n();

const alert = inject('alert');

const { project, dataset } = useRequestData();

const approvalRequired = ref(dataset.approvalRequired);

const pendingSubmissionModal = ref({
  state: false,
  pendingSubmissions: 0
});

watch(() => dataset.dataExists, () => {
  approvalRequired.value = dataset.approvalRequired;
});

const update = (convert) => {
  if (dataset.awaitingResponse) return;

  dataset.request({
    method: 'PATCH',
    url: apiPaths.dataset(project.id, dataset.name, { convert }),
    data: { approvalRequired: approvalRequired.value },
    fulfillProblem: ({ code }) => code === 400.29,
    patch: ({ data }) => {
      if (isProblem(data)) {
        pendingSubmissionModal.value.pendingSubmissions = data.details.count;
        pendingSubmissionModal.value.state = true;
      } else {
        dataset.approvalRequired = data.approvalRequired;
        alert.success(dataset.approvalRequired ? t('onApproval.successMessage') : t('onReceipt.successMessage'));
      }
    }
  })
    .catch(() => {
      approvalRequired.value = dataset.approvalRequired;
    });
};

const hideAndUpdate = (convert) => {
  pendingSubmissionModal.value.state = false;
  update(convert);
};

const hideAndReset = () => {
  pendingSubmissionModal.value.state = false;
  approvalRequired.value = dataset.approvalRequired;
};
</script>


<style lang="scss"></style>

<i18n lang="json5">
{
  "en": {
    // This is a title shown above a section of the page.
    "entityWorkflow": "Entity Workflow",
    "onReceipt": {
      "label": "Create Entities as soon as Submissions are received by Central",
      "description": "You will not have a chance to review or revise data before Entities are created.",
      "successMessage": "Entities will be created as soon as Submissions are received by Central."
    },
    "onApproval": {
      "label": "Create Entities when Submissions are marked as Approved",
      "description": "Entity data will not update until a person reviews the data. Corrections can be made if necessary.",
      "successMessage": "Entities will be created when Submissions are marked as Approved."
    }
  }
}
</i18n>
