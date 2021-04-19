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
  <page-section id="submission-audit-list" condensed>
    <template #heading>
      <span>{{ $t('common.activity') }}</span>
      <template v-if="project != null && project.permits('submission.update')">
        <button id="submission-audit-list-update-review-state-button"
          type="button" class="btn btn-default"
          @click="$emit('update-review-state')">
          <span class="icon-check"></span>{{ $t('action.review') }}
        </button>
        <template v-if="submission != null">
          <a v-if="submission.__system.status == null"
            id="submission-audit-list-edit-button" class="btn btn-default"
            :href="editPath" target="_blank">
            <span class="icon-pencil"></span>{{ $t('action.edit') }}
          </a>
          <button v-else id="submission-audit-list-edit-button" type="button"
            class="btn btn-default" disabled
            :title="$t('submission.editDisabled')">
            <span class="icon-pencil"></span>{{ $t('action.edit') }}
          </button>
        </template>
      </template>
    </template>
    <template #body>
      <submission-audit-table/>
      <loading :state="$store.getters.initiallyLoading(['audits'])"/>
    </template>
  </page-section>
</template>

<script>
import Loading from '../../loading.vue';
import PageSection from '../../page/section.vue';
import SubmissionAuditTable from './table.vue';

import { apiPaths } from '../../../util/request';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'SubmissionAuditList',
  components: { Loading, PageSection, SubmissionAuditTable },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    }
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project', 'submission', 'audits']),
    editPath() {
      return apiPaths.editSubmission(
        this.projectId,
        this.xmlFormId,
        this.instanceId
      );
    }
  }
};
</script>

<style lang="scss">
#submission-audit-list-update-review-state-button { margin-right: 5px; }
</style>
