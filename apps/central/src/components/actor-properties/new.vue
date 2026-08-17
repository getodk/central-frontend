<template>
  <div class="actor-properties-new">
    <form v-if="showForm" class="actor-properties-new-form" @submit.prevent="submit">
      <form-group ref="nameGroup" v-model.trim="name"
        :placeholder="$t('newPropertyName')" required autocomplete="off"/>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary"
          :aria-disabled="awaitingResponse">
          {{ $t('action.add') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="showForm = false">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </form>
    <a v-else href="#" class="add-property-link"
      @click.prevent="showForm = true; nextTick(() => nameGroup.focus())">
      {{ $t('addProperty') }}
    </a>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

defineOptions({
  name: 'ActorPropertiesNew'
});

const emit = defineEmits(['success']);

const { request, awaitingResponse } = useRequest();
const { project, actorProperties } = useRequestData();
const { t } = useI18n();

const nameGroup = ref(null);
const name = ref('');
const showForm = ref(false);

const reset = () => {
  name.value = '';
  showForm.value = false;
};

const submit = () => {
  request({
    method: 'POST',
    url: apiPaths.actorProperties(project.id),
    data: { name: name.value },
    problemToAlert: ({ code, details }) =>
      (code === 409.3 && details.fields[0] === 'projectId' && details.fields[1] === 'name'
        ? t('problem.409_3', { propertyName: details.values[1] })
        : null)
  })
    .then(() => {
      actorProperties.data = [...actorProperties.data, { name: name.value }];
      emit('success');
      reset();
    })
    .catch(noop);
};

defineExpose({ reset });
</script>

<style lang="scss">
.actor-properties-new-form {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .form-group {
    flex: 1;
    margin-bottom: 0;
  }

  .form-actions {
    white-space: nowrap;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "addProperty": "+ Add Property",
    "newPropertyName": "New property name",
    "problem": {
      "409_3": "A property already exists in this project with the name \"{propertyName}\"."
    },
    "action": {
      "add": "Add"
    }
  }
}
</i18n>
