<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
    <modal id="attachment-dataset-restore" :state="state" :hideable="!awaitingResponse"
      backdrop @hide="$emit('hide')">
      <template #title>{{ $t(action + '.title') }}</template>
      <template #body>
        <div class="modal-introduction">
            <p>{{ $t(action + '.introduction') }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-danger btn-restore"
            :disabled="awaitingResponse" @click="restore">
            {{ $t(action + '.action.restore') }} <spinner :state="awaitingResponse"/>
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
import { useRequestData } from '../../request-data';

export default {
  name: 'FormAttachmentRestoreLink',
  components: { Modal, Spinner },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    attachmentName: {
      type: String,
      required: true
    },
    // possible values: restore, link
    action: {
      type: String,
      default: 'restore'
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { form } = useRequestData();
    return { form };
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  methods: {
    restore() {
      this.request({
        method: 'PATCH',
        url: apiPaths.formDraftAttachment(this.form.projectId, this.form.xmlFormId, this.attachmentName),
        data: { dataset: true }
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
      "restore": {
        // This is the title at the top of a pop-up.
        "title": "Restore Dataset Link",
        "introduction": "Are you sure you want to restore the Dataset link? The override file you uploaded will be deleted. You can always upload it again later.",
        "action": {
          "restore": "Restore"
        }
      },
      "link": {
        // This is the title at the top of a pop-up.
        "title": "Link Dataset",
        "introduction": "Are you sure you want to link the Dataset?",
        "action": {
          "restore": "Link"
        }
      }
    }
  }
  </i18n>
