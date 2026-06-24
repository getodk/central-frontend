<template>
  <modal id="public-link-edit" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusFirstProperty">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>
          <strong>{{ $t('displayNameLabel') }}</strong>
          <sentence-separator/>
          <span>{{ publicLink?.displayName }}</span>
        </p>
      </div>
      <div class="public-link-edit-properties">
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
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'PublicLinkEdit'
});

const props = defineProps({
  state: Boolean,
  publicLink: Object
});

const emit = defineEmits(['hide', 'success']);

const { form, actorProperties } = useRequestData();
const { request, awaitingResponse } = useRequest();

const propertyValues = ref(Object.create(null));

const focusFirstProperty = () => {
  const input = document.querySelector('#public-link-edit .actor-properties-upsert textarea');
  input?.focus();
};

const submit = () => {
  request({
    method: 'PATCH',
    url: apiPaths.publicLink(form.projectId, form.xmlFormId, props.publicLink.id),
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
    propertyValues.value = { ...props.publicLink.properties };
  }
});
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up for editing a Public Access Link.
    "title": "Edit Public Access Link",
    // Shown as label before the display name of the Public Access Link in the edit pop-up.
    "displayNameLabel": "Public Link"
  }
}
</i18n>
