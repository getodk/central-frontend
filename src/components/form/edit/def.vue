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
  <form-edit-section id="form-edit-def" icon="code">
    <template #title>{{ $t('resource.formDef') }}</template>
    <template #subtitle>{{ $t('subtitle') }}</template>
    <template #body>
      <div id="form-edit-def-container">
        <div>
          <form-version-string :version="formDraft.version"/>
        </div>
        <div>
          <form-version-standard-buttons :version="formDraft"
            @view-xml="viewXml.show()"/>
          <button id="form-edit-upload-button" type="button"
            class="btn btn-primary" @click="$emit('upload')">
            <span class="icon-upload"></span>{{ $t('action.upload') }}
          </button>
        </div>
      </div>
      <form-edit-attachments/>
      <form-edit-entities/>
    </template>
  </form-edit-section>

  <form-version-view-xml v-bind="viewXml" @hide="viewXml.hide()"/>
</template>

<script setup>
import { defineAsyncComponent } from 'vue';

import FormEditAttachments from './attachments.vue';
import FormEditEntities from './entities.vue';
import FormEditSection from './section.vue';
import FormVersionStandardButtons from '../../form-version/standard-buttons.vue';
import FormVersionString from '../../form-version/string.vue';

import { loadAsync } from '../../../util/load-async';
import { modalData } from '../../../util/reactivity';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'FormEditDef'
});
defineEmits(['upload']);

const { resourceView } = useRequestData();
const formDraft = resourceView('formDraft', (data) => data.get());

const FormVersionViewXml = defineAsyncComponent(loadAsync('FormVersionViewXml'));
const viewXml = modalData('FormVersionViewXml');
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#form-edit-def {
  margin-bottom: 0;
}

#form-edit-def-container {
  display: flex;
  align-items: center;
  column-gap: 15px;

  background-color: $background-color-feed-entry;
  border: 2px solid $color-subpanel-border;
  border-radius: 15px;
  padding: 12px 15px;

  > :first-child {
    @include text-overflow-ellipsis;
    font-size: 17px;
    font-weight: bold;
  }

  > :nth-child(2) {
    flex-shrink: 0;
    margin-left: auto;
  }
}

#form-edit-upload-button { margin-left: 5px; }
</style>

<i18n lang="json5">
{
  "en": {
    // This refers to a Form Definition.
    "subtitle": "Uploaded",
    "action": {
      "upload": "Upload new Form Definition"
    }
  }
}
</i18n>
