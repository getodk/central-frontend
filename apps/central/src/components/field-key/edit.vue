<template>
  <modal id="field-key-edit" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusFirstProperty">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>
          <strong>{{ $t('displayNameLabel') }}</strong>
          <sentence-separator/>
          <span>{{ fieldKey?.displayName }}</span>
        </p>
      </div>
      <div class="field-key-edit-properties">
        <actor-properties-upsert v-if="actorProperties.dataExists"
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
import SentenceSeparator from '../sentence-separator.vue';
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

const { project, createResource } = useRequestData();
const { request, awaitingResponse } = useRequest();

const actorProperties = createResource('actorProperties');

const fetchActorProperties = () => {
  const url = apiPaths.actorProperties(project.id);
  return actorProperties.request({ url }).catch(() => { emit('hide'); });
};

const propertyValues = ref(Object.create(null));

const focusFirstProperty = () => {
  const input = document.querySelector('#field-key-edit .actor-properties-upsert input');
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
    propertyValues.value = { ...props.fieldKey?.properties };
    if (!actorProperties.dataExists)
      fetchActorProperties();
  }
});
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up for editing an App User.
    "title": "Edit App User",
    "displayNameLabel": "App User"
  }
}
</i18n>
