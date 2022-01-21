<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="form-restore" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div v-if="form" class="modal-introduction">
        <i18n tag="p" path="introduction[0]">
          <template #name>
            <strong>{{ form.nameOrId() }}</strong>
          </template>
        </i18n>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger"
          :disabled="awaitingResponse" @click="doRestore">
          {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.noCancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'FormRestore',
  components: { Modal, Spinner },
  mixins: [request()],
  props: {
    state: Boolean,
    form: Object
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  methods: {
    doRestore() {
      this.post(apiPaths.restoreForm(this.form.projectId, this.form.id))
        .then(() => {
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
    "title": "Undelete Form",
    "introduction": [
      "Are you sure you want to undelete the Form {name}?",
      "The Form will be restored to its previous state, including all data, settings, and permissions.",
      "If the Form is deleted again, it will be another 30 days before it is removed."
    ]
  }
}
</i18n>
