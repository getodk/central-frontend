<template>
  <modal id="custom-properties-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="nameGroup.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction') }}</p>
      </div>
      <form @submit.prevent="submit">
        <form-group ref="nameGroup" v-model.trim="name"
          :placeholder="$t('newPropertyName')" required autocomplete="off"/>
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { equals } from 'ramda';

import Modal from '../../modal.vue';
import FormGroup from '../../form-group.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { useRequestData } from '../../../request-data';
import { noop } from '../../../util/util';

defineOptions({
  name: 'CustomPropertyNew'
});

const props = defineProps({
  state: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['hide', 'success']);

const { request, awaitingResponse } = useRequest();
const { project } = useRequestData();
const { t } = useI18n();

const nameGroup = ref(null);
const name = ref('');

watch(() => props.state, (state) => {
  if (!state) name.value = '';
});

const submit = () => {
  request({
    method: 'POST',
    url: apiPaths.actorProperties(project.id),
    data: { name: name.value },
    problemToAlert: ({ code, details }) =>
      (code === 409.3 && equals(details.fields, ['projectId', 'name'])
        ? t('problem.409_3', { propertyName: details.values[1] })
        : null)
  })
    .then(() => {
      emit('success');
    })
    .catch(noop);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Add Custom Property",
    "introduction": "To add a custom property for this project, choose a unique property name below.",
    "newPropertyName": "New property name",
    "problem": {
      "409_3": "A custom property already exists in this project with the name of \"{propertyName}\"."
    }
  }
}
</i18n>
