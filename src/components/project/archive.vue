<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="project-archive" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ project != null ? $t('introduction[0]', project) : '' }}</p>
        <i18n tag="p" path="introduction[1].full">
          <template #noUndo>
            <strong>{{ $t('introduction[1].noUndo') }}</strong>
          </template>
        </i18n>
        <p>{{ $t('common.areYouSure') }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger"
          :disabled="awaitingResponse" @click="archive">
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
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectArchive',
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
  computed: requestData(['project']),
  methods: {
    archive() {
      this.patch(apiPaths.project(this.project.id), { archived: true })
        .then(response => {
          this.$store.commit('setData', {
            key: 'project',
            // We do not simply specify response.data, because it does not
            // include extended metadata.
            value: this.project.with({
              archived: true,
              updatedAt: response.data.updatedAt
            })
          });
          this.$emit('success', this.project);
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
    "title": "Archiving Project",
    "introduction": [
      "You are about to archive the Project “{name}”. It will still work as it does now, but it will be sorted to the bottom of the Project List on the Central homepage.",
      {
        "full": "{noUndo}, but the ability to unarchive a Project is planned for a future release.",
        "noUndo": "This action cannot be undone"
      }
    ]
  }
}
</i18n>
