<template>
  <modal id="field-key-edit" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusFirstProperty">
    <template #title>{{ $t('title', { displayName: fieldKey?.displayName }) }}</template>
    <template #body>
      <div class="field-key-edit-properties">
        <actor-properties-upsert v-if="state && actorProperties.dataExists"
          v-model:propertyValues="propertyValues"
          :create="false" :property-defs="actorProperties.data"/>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="submit">
          {{ $t('action.save') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';

import ActorPropertiesUpsert from '../actor-properties/upsert.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FieldKeyEdit'
});

const props = defineProps({
  state: Boolean,
  fieldKey: Object
});

const emit = defineEmits(['hide', 'success']);

const { project, actorProperties } = useRequestData();
const { request, awaitingResponse } = useRequest();

const propertyValues = ref(Object.create(null));

const focusFirstProperty = () => {
  const input = document.querySelector('#field-key-edit .actor-properties-upsert textarea');
  input?.focus();
};

const submit = () => {
  request({
    method: 'PATCH',
    url: apiPaths.fieldKey(project.id, props.fieldKey.id),
    data: { properties: propertyValues.value }
  })
    .then(({ data }) => {
      emit('success', data);
    })
    .catch(noop);
};

watch(() => props.state, (state) => {
  if (!state) {
    propertyValues.value = Object.create(null);
  } else {
    propertyValues.value = Object.assign(Object.create(null), props.fieldKey.properties);
  }
});
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up for editing an App User. {displayName} is the
    // the name of the App User
    "title": "Edit App User “{displayName}”",
    // Shown as label before the display name of the App User in the edit pop-up.
    "displayNameLabel": "App User"
  }
}
</i18n>
