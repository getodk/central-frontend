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
  <form-edit-section icon="pencil">
    <template #title>{{ $t('title') }}</template>
    <template #subtitle>{{ $t('subtitle') }}</template>
    <template #body>
      <button id="form-edit-create-draft-button" type="button"
        class="btn btn-primary" :aria-disabled="awaitingResponse"
        @click="create">
        <span class="icon-pencil"></span>{{ $t('action.create') }}
        <spinner :state="awaitingResponse"/>
      </button>
      <p>{{ $t('toMakeChanges') }}</p>
      <p>{{ $t('noEffectUntilPublish') }}</p>
    </template>
  </form-edit-section>
</template>

<script setup>
import { inject } from 'vue';

import FormEditSection from './section.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';

defineOptions({
  name: 'FormEditCreateDraft'
});
const emit = defineEmits(['success']);

const { request, awaitingResponse } = useRequest();
const projectId = inject('projectId');
const xmlFormId = inject('xmlFormId');
const create = () => {
  request({
    method: 'POST',
    url: apiPaths.formDraft(projectId, xmlFormId)
  })
    .then(() => { emit('success'); })
    .catch(noop);
};
</script>

<style lang="scss">
#form-edit-create-draft-button {
  font-size: 14px;

  ~ p { color: #666; }
  + p { margin-block: 3px 0; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This refers to the draft version of a Form.
    "title": "Draft version",
    "subtitle": "No active Draft for this Form",
    "action": {
      // @transifexKey component.FormHead.draftNav.action.create
      "create": "Create a new Draft"
    },
    // This text is shown below a button with the text "Create a new Draft".
    "toMakeChanges": "to make changes to this Form or its attachments.",
    "noEffectUntilPublish": "The published version will not be affected until you publish your Draft."
  }
}
</i18n>
