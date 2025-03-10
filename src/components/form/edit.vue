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
        <form-edit-loading-draft v-if="!formDraft.dataExists"/>
        <form-edit-create-draft v-else-if="formDraft.isEmpty()"
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
import { computed, provide, watchEffect } from 'vue';

import FormAttachmentList from '../form-attachment/list.vue';
import FormDraftStatus from '../form-draft/status.vue';
import FormDraftTesting from '../form-draft/testing.vue';
import FormEditCreateDraft from './edit/create-draft.vue';
import FormEditLoadingDraft from './edit/loading-draft.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
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

const { formVersions, formDraft, draftAttachments } = useRequestData();

const fetchDraft = (resend) => {
  formDraft.request({
    url: apiPaths.formDraft(props.projectId, props.xmlFormId),
    extended: true,
    fulfillProblem: ({ code }) => code === 404.1,
    resend
  }).catch(noop);
};
fetchDraft(false);

// Most requests only need to be sent if there is a form draft. Here, we check
// whether there is a form draft before sending additional requests.
watchEffect(() => {
  if (!(formDraft.dataExists && formDraft.isDefined())) return;
  Promise.allSettled([
    draftAttachments.request({
      url: apiPaths.formDraftAttachments(props.projectId, props.xmlFormId),
      resend: false
    }),
    formVersions.request({
      url: apiPaths.formVersions(props.projectId, props.xmlFormId),
      extended: true,
      resend: false
    })
  ]);
});

const rendersAttachments = computed(() =>
  draftAttachments.dataExists && draftAttachments.size !== 0);
</script>
