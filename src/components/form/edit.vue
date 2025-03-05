<!--
Copyright 2025 ODK Central Developers
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
    <div class="row">
      <div class="col-xs-6">
        <form-edit-create-draft v-if="formDraft.dataExists && formDraft.isEmpty()"
          @success="fetchDraft(true)"/>
      </div>
    </div>
    <template v-if="formDraft.dataExists && formDraft.isDefined()">
      <form-draft-status @fetch-project="$emit('fetch-project', $event)"
        @fetch-form="$emit('fetch-form')" @fetch-draft="fetchDraft(true)"
        @fetch-linked-datasets="$emit('fetch-linked-datasets')"/>
      <form-attachment-list v-if="rendersAttachments"/>
      <form-draft-testing/>
    </template>
  </div>
</template>

<script setup>
import { computed, provide } from 'vue';

import FormAttachmentList from '../form-attachment/list.vue';
import FormDraftStatus from '../form-draft/status.vue';
import FormDraftTesting from '../form-draft/testing.vue';
import FormEditCreateDraft from './edit/create-draft.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormEdit'
});
const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  }
});
defineEmits(['fetch-project', 'fetch-form', 'fetch-linked-datasets']);
provide('projectId', props.projectId);
provide('xmlFormId', props.xmlFormId);

const { formDraft, attachments } = useRequestData();

const fetchDraft = (resend) => {
  Promise.allSettled([
    formDraft.request({
      url: apiPaths.formDraft(props.projectId, props.xmlFormId),
      extended: true,
      fulfillProblem: ({ code }) => code === 404.1,
      resend
    }),
    attachments.request({
      url: apiPaths.formDraftAttachments(props.projectId, props.xmlFormId),
      fulfillProblem: ({ code }) => code === 404.1,
      resend
    })
  ]);
};
fetchDraft(false);

const rendersAttachments = computed(() => attachments.dataExists &&
  attachments.isDefined() && attachments.get().size !== 0);
</script>
