<template>
  <dropdown class="submission-def-dropdown">
    <template #toggle="{ toggle, attrs }">
      <button type="button" class="btn btn-default"
        v-bind="attrs" @click="toggle">
        <span class="icon-code"></span>
        <span>{{ $t('action.def') }}</span>
        <span class="caret"></span>
      </button>
    </template>
    <template #menu>
      <li>
        <a href="#" @click.prevent="$emit('view-xml')">{{ $t('action.viewXml') }}</a>
      </li>
      <li>
        <a :href="xmlPath" :download="`${instanceId}.xml`">
          {{ $t('action.downloadXml') }}
        </a>
      </li>
    </template>
  </dropdown>
</template>

<script setup>
import { computed } from 'vue';

import Dropdown from '../dropdown.vue';

import { apiPaths } from '../../util/request';

defineOptions({ name: 'SubmissionDefDropdown' });

const props = defineProps({
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
});

defineEmits(['view-xml']);

const xmlPath = computed(() =>
  apiPaths.submissionXml(props.projectId, props.xmlFormId, props.instanceId));
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      // @transifexKey component.FormVersionDefDropdown.action.def
      "def": "Definition",
      // @transifexKey component.FormVersionDefDropdown.action.viewXml
      "viewXml": "View XML in browser",
      "downloadXml": "Download XML"
    }
  }
}
</i18n>
