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
    <form-draft-status :project-id="projectId" :xml-form-id="xmlFormId"
      @fetch-project="$emit('fetch-project', $event)"
      @fetch-form="$emit('fetch-form')" @fetch-draft="$emit('fetch-draft')"
      @fetch-linked-datasets="$emit('fetch-linked-datasets')"/>
    <form-attachment-list v-if="rendersAttachments" :project-id="projectId"/>
    <form-draft-testing :project-id="projectId" :xml-form-id="xmlFormId"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import FormAttachmentList from '../form-attachment/list.vue';
import FormDraftStatus from '../form-draft/status.vue';
import FormDraftTesting from '../form-draft/testing.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormEdit'
});
defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  }
});
defineEmits(['fetch-project', 'fetch-form', 'fetch-draft', 'fetch-linked-datasets']);

const { attachments } = useRequestData();

const rendersAttachments = computed(() => attachments.dataExists &&
  attachments.isDefined() && attachments.get().size !== 0);
</script>
