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
  <form-edit-section id="form-edit-attachments" icon="paperclip" dotted
    :warning="hasMissing">
    <template #title>{{ $t('resource.attachments') }}</template>
    <template v-if="hasAttachments" #subtitle>
      <template v-if="hasMissing">
        {{ $tcn('missingCount', draftAttachments.missingCount) }}
      </template>
      <template v-else>
        {{ $tcn('count.attachments', draftAttachments.size) }}
      </template>
    </template>
    <template #body>
      <loading :state="draftAttachments.initiallyLoading"/>
      <template v-if="draftAttachments.dataExists">
        <form-attachment-list v-if="hasAttachments"/>
        <p v-else>{{ $t('noAttachments') }}</p>
      </template>
    </template>
  </form-edit-section>
</template>

<script setup>
import { computed } from 'vue';

import FormAttachmentList from '../../form-attachment/list.vue';
import FormEditSection from './section.vue';
import Loading from '../../loading.vue';

import { useRequestData } from '../../../request-data';

const { draftAttachments } = useRequestData();

const hasAttachments = computed(() =>
  draftAttachments.dataExists && draftAttachments.size !== 0);
const hasMissing = computed(() =>
  draftAttachments.dataExists && draftAttachments.missingCount !== 0);
</script>

<style lang="scss">
#form-edit-attachments {
  .form-edit-section-body { margin-bottom: 42px; }
  :has(#form-attachment-list) .form-edit-section-body { margin-bottom: 12px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // "Definition" refers to a Form Definition, and "attachments" refers to
    // Form Attachments.
    "noAttachments": "This definition requires no attachments, so there is nothing to upload.",
    "missingCount": "{count} missing attachment | {count} missing attachments"
  }
}
</i18n>
