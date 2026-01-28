<!--
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="dataset-delete" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n-t tag="p" keypath="introduction[0]">
          <template #name>
            <strong>{{ dataset.name }}</strong>
          </template>
        </i18n-t>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.noCancel') }}
        </button>
        <button type="button" class="btn btn-danger"
          :aria-disabled="awaitingResponse" @click="del">
          {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'DatasetDelete',
  components: { Modal, Spinner },
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, dataset } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    return { project, dataset, request, awaitingResponse };
  },
  methods: {
    del() {
      this.request({
        method: 'DELETE',
        url: apiPaths.dataset(this.dataset.projectId, this.dataset.name)
      })
        .then(() => {
          this.project.datasets -= 1;
          // project.lastEntity may now be out-of-date. However,
          // project.lastEntity is not used within ProjectShow.

          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Delete Entity List",
    "introduction": [
      "Are you sure you want to delete the Entity List ‟{name}”? This cannot be undone."
    ]
  }
}
</i18n>
