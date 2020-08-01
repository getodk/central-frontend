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
  <modal id="form-draft-abandon" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template #title>{{ title }}</template>
    <template #body>
      <div class="modal-introduction">
        <template v-if="form.publishedAt != null">
          <p>{{ $t('introduction.abandon[0]') }}</p>
          <p>{{ $t('introduction.abandon[1]') }}</p>
        </template>
        <template v-else>
          <p>{{ $t('introduction.deleteForm[0]') }}</p>
        </template>
        <p>{{ $t('common.areYouSure') }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger"
          :disabled="awaitingResponse" @click="abandon">
          {{ $t('action.abandon') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
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
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDraftAbandon',
  components: { Modal, Spinner },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['form']),
    title() {
      return this.form.publishedAt != null
        ? this.$t('title.abandon')
        : this.$t('title.deleteForm');
    }
  },
  methods: {
    abandon() {
      this.request({
        method: 'DELETE',
        url: this.form.publishedAt != null
          ? apiPaths.formDraft(this.form.projectId, this.form.xmlFormId)
          : apiPaths.form(this.form.projectId, this.form.xmlFormId)
      })
        .then(() => {
          // project.forms and project.lastSubmission may now be out-of-date. If
          // the user navigates to ProjectOverview, project.forms should be
          // updated. project.lastSubmission is not used within ProjectShow.
          this.$emit('success', this.form);
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
    "title": {
      "abandon": "Abandon Draft",
      "deleteForm": "Abandon Draft and Delete Form"
    },
    "introduction": {
      "abandon": [
        "You are about to permanently delete the Draft version of this Form. This means that the draft Form definition, any draft Media Files you have uploaded, and all test Submissions will be removed.",
        "Your published Form definition, its Media Files, and Submissions will not be affected."
      ],
      "deleteForm": [
        "You are about to permanently delete this draft Form definition, along with any draft Media Files you have uploaded, and all test Submissions. Because you have not yet published it, this Form will be entirely deleted."
      ]
    },
    "action": {
      "abandon": "Abandon"
    }
  }
}
</i18n>
