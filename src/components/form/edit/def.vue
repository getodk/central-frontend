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
    <template #title>{{ $t('title') }}</template>
    <template #subtitle>{{ $t('subtitle') }}</template>
    <template v-if="changed" #tag>{{ $t('changed') }}</template>
    <template #body>
      <div id="form-edit-def-container">
        <div>
          <i18n-t keypath="versionName">
            <template #name>
              <form-version-string :version="formDraft.version"/>
            </template>
          </i18n-t>
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
      <div id="form-edit-def-within">
        <span class="icon-file-code-o"></span>{{ $t('withinDef') }}
      </div>
      <form-edit-attachments/>
      <form-edit-entities/>
    </template>
  </form-edit-section>

  <form-version-view-xml v-bind="viewXml" @hide="viewXml.hide()"/>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';

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

const { form, resourceView } = useRequestData();
const formDraft = resourceView('formDraft', (data) => data.get());

const changed = computed(() =>
  form.dataExists && form.publishedAt != null && formDraft.hash !== form.hash);

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

#form-edit-def-within {
  color: #888;
  margin-block: 5px 6px;

  .icon-file-code-o {
    color: #777;
    margin-inline: 31px 5px;
  }

  &::after {
    border-left: 2px dotted #999;
    content: '';
    display: block;
    height: 18px;
    margin-left: 36px;
    margin-top: 3px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.FormEditCreateDraft.title
    "title": "Draft version",
    // This refers to the draft version of a Form.
    "subtitle": "Uploaded",
    // This refers to the draft version of a Form.
    "changed": "Changed from published version",
    // This is shown for a Form version.
    "versionName": "Version name: {name}",
    "action": {
      "upload": "Upload new Form Definition"
    },
    // This text is shown above a list of items that are part of the Form
    // Definition.
    "withinDef": "Within this Form Definition:"
  }
}
</i18n>
