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
    <template #tag>{{ tag }}</template>
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
import { useI18n } from 'vue-i18n';

import FormAttachmentList from '../../form-attachment/list.vue';
import FormEditSection from './section.vue';
import Loading from '../../loading.vue';

import { useI18nUtils } from '../../../util/i18n';
import { useRequestData } from '../../../request-data';

const { publishedAttachments, draftAttachments } = useRequestData();

const hasAttachments = computed(() =>
  draftAttachments.dataExists && draftAttachments.size !== 0);
const hasMissing = computed(() =>
  draftAttachments.dataExists && draftAttachments.missingCount !== 0);

const { t } = useI18n();
const { tn, formatList } = useI18nUtils();
const tag = computed(() => {
  if (!(hasAttachments.value && publishedAttachments.dataExists)) return '';

  let newCount = 0;
  let changedCount = 0;
  for (const draftAttachment of draftAttachments.values()) {
    const publishedAttachment = publishedAttachments.get(draftAttachment.name);
    if (publishedAttachment == null)
      newCount += 1;
    else if (draftAttachment.hash !== publishedAttachment.hash ||
      draftAttachment.datasetExists !== publishedAttachment.datasetExists)
      changedCount += 1;
  }

  const parts = [];
  if (newCount !== 0) parts.push(tn('diff.newCount', newCount));
  if (changedCount !== 0) parts.push(tn('diff.changedCount', changedCount));
  return parts.length !== 0
    ? t('diff.summary', { changes: formatList(parts, 'long') })
    : '';
});
</script>

<style lang="scss">
#form-edit-attachments {
  .form-edit-section-body { margin-bottom: 51px; }
  &:has(#form-attachment-list) .form-edit-section-body { margin-bottom: 21px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // "Definition" refers to a Form Definition, and "attachments" refers to
    // Form Attachments.
    "noAttachments": "This definition requires no attachments, so there is nothing to upload.",
    "missingCount": "{count} missing attachment | {count} missing attachments",
    "diff": {
      "newCount": "{count} new attachment | {count} new attachments",
      "changedCount": "{count} changed attachment | {count} changed attachments",
      // {changes} describes changes that have been made to Form attachments.
      // For example: "1 new attachment and 2 changed attachments"
      "summary": "{changes} since the published version"
    }
  }
}
</i18n>
