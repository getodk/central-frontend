<template>
  <div class="actor-properties-new">
    <template v-if="showForm">
      <div class="actor-properties-header">
        <strong>{{ $t('addProperty') }}</strong>
        <p>{{ $t('addPropertyHint') }}</p>
      </div>
      <form class="actor-properties-new-form" @submit.prevent="submit">
        <form-group ref="nameGroup" v-model.trim="name"
          :placeholder="$t('newPropertyName')" required
          :has-error="error != null" autocomplete="off">
          <template v-if="error != null" #after>
            <p class="help-block">
              <span class="icon-exclamation-circle"></span>{{ error }}
            </p>
          </template>
        </form-group>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary"
            :aria-disabled="disabled">
            {{ $t('action.add') }}
          </button>
          <button type="button" class="btn btn-link"
            :aria-disabled="disabled" @click="reset()">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
    </template>
    <a v-else href="#" class="add-property-link"
      @click.prevent="show()">
      <span class="icon-plus-circle"></span>{{ $t('addProperty') }}
    </a>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import FormGroup from '../form-group.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

defineOptions({
  name: 'ActorPropertiesNew'
});
const props = defineProps({
  propertyNames: Array,
  disabled: Boolean
});
const emit = defineEmits(['success']);

const { request, awaitingResponse } = useRequest();
const { project, actorProperties } = useRequestData();
const { t } = useI18n();

const nameGroup = ref(null);
const name = ref('');
const showForm = ref(false);

const lowercaseProperties = computed(() => (props.propertyNames ?? []).reduce(
  (map, name) => map.set(name.toLowerCase(), name),
  new Map()
));
const error = () => computed(() => {
  if (name.value === '') return null;

  if (!validatePropertyName(name.value) || name.value === 'displayName')
    return t('error.invalid');

  const existingProperty = lowercaseProperties.get(name.value.toLowerCase());
  if (existingProperty != null) {
    return name.value === existingProperty
      ? t('error.exactDuplicate')
      : t('error.caseInsensitiveDuplicate');
  }

  return null;
});
watchEffect(() => { nameGroup.value.setCustomValidity(error.value ?? ''); });

const show = () => {
  showForm.value = true;
  nextTick(() => nameGroup.value.focus());
};

const reset = () => {
  name.value = '';
  showForm.value = false;
};

const submit = () => { if (!props.disabled) emit('success', name.value); };

defineExpose({ reset });
</script>

<style lang="scss">
.actor-properties-new {
  padding-top: 8px;
}
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
    "addProperty": "Add Property",
    "addPropertyHint": "Enter a unique property name",
    // @transifexKey component.ProjectCustomPropertiesNew.newPropertyName
    "newPropertyName": "New property name",
    "error": {
      "invalid": "[PLACEHOLDER] Invald property",
      "exactDuplicate": "[PLACEHOLDER] Exact duplicate",
      "caseInsensitiveDuplicate": "[PLACEHOLDER] Case-insensitive duplicate"
    }
  }
}
</i18n>
