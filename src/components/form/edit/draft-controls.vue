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
  <form-edit-section id="form-edit-draft-controls" icon="pencil" dotted>
    <template #title>{{ $t('title') }}</template>
    <template #subtitle>{{ $t('subtitle') }}</template>
    <template #body>
      <button id="form-edit-abandon-button" type="button" class="btn btn-danger"
        @click="$emit('abandon')">
        <span class="icon-trash"></span>{{ abandonText }}
      </button>
      <button id="form-edit-publish-button" type="button"
        class="btn btn-primary" @click="$emit('publish')">
        <span class="icon-star"></span>{{ $t('action.publish') }}
      </button>
    </template>
  </form-edit-section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import FormEditSection from './section.vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'FormEditDraftControls'
});
defineEmits(['abandon', 'publish']);

const { form } = useRequestData();

const { t } = useI18n();
const abandonText = computed(() => (!form.dataExists
  ? ''
  : (form.publishedAt == null ? t('action.delete') : t('action.abandon'))));
</script>

<style lang="scss">
#form-edit-publish-button { margin-left: 10px; }
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.FormEditCreateDraft.title
    "title": "Draft version",
    // This refers to the draft version of a Form.
    "subtitle": "Ready to publish",
    "action": {
      "delete": "Delete Form",
      // @transifexKey component.FormDraftStatus.actions.action.abandon
      "abandon": "Abandon Draft",
      // @transifexKey component.FormDraftStatus.actions.action.publish
      "publish": "Publish Draft"
    }
  }
}
</i18n>
