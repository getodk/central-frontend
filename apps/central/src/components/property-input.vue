<template>
  <form-group ref="groupRef" v-model.trim="modelValue" class="property-input"
    :placeholder="$t('placeholder')" required :has-error="error != null"
    :aria-describedby="error != null ? errorId : null" autocomplete="off"/>
  <div v-if="error != null" :id="errorId" class="property-input-error">
    <p><span class="icon-exclamation-circle"></span>{{ error.title }}</p>
    <p>
      <template v-if="error.description != null">
        <span>{{ error.description }}</span>
        <sentence-separator/>
      </template>
      <span>{{ $t('tryDifferent') }}</span>
    </p>
  </div>
</template>

<script setup>
import { computed, ref, useId, watchSyncEffect } from 'vue';
import { useI18n } from 'vue-i18n';

import FormGroup from './form-group.vue';
import SentenceSeparator from './sentence-separator.vue';

import { validatePropertyName } from '../util/entity';

const props = defineProps({
  // 'entity' for an entity property; 'actor' for an actor property.
  type: {
    type: String,
    default: 'entity'
  },
  // Array of property names or property names
  properties: {
    type: Array,
    required: true
  }
});
const modelValue = defineModel({ required: true });

const { t } = useI18n();

const groupRef = ref(null);

const lowercaseProperties = computed(() => props.properties.reduce(
  (set, property) => {
    const name = typeof property === 'string' ? property : property.name;
    return set.add(name.toLowerCase());
  },
  new Set()
));
const error = computed(() => {
  if (modelValue.value === '') return null;

  if (!validatePropertyName(modelValue.value) ||
    (props.type === 'actor' && modelValue.value === 'displayName'))
    return { title: t('invalidName') };

  if (lowercaseProperties.value.has(modelValue.value.toLowerCase()))
    return { title: t('duplicate.title'), description: t('duplicate.description') };

  return null;
});
watchSyncEffect(() => {
  groupRef.value?.setCustomValidity(error.value?.title ?? '');
});
const errorId = useId();

defineExpose({
  focus: () => { groupRef.value.focus(); }
});
</script>

<style lang="scss">
@import '../assets/scss/variables';

.form-group:has(.property-input) {
  &.has-error { margin-bottom: 0; }
}

// Styled similarly to EntityUploadAlert.
.property-input-error {
  background-color: $color-danger-light;
  border-radius: 12px;
  margin-block: 10px $margin-bottom-form-group;
  padding: 10px 15px;

  > :first-child {
    color: $color-danger;
    margin-bottom: 5px;
  }

  > :last-child { margin-bottom: 0; }

  .icon-exclamation-circle { margin-right: $margin-right-icon; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.DatasetOverviewNewProperty.newPropertyName
    "placeholder": "New property name",
    "invalidName": "Property name is invalid",
    "duplicate": {
      "title": "A property with this name already exists",
      "description": "Property names must be unique, regardless of capitalization."
    },
    // "Name" refers to the name of an Entity property.
    "tryDifferent": "Try a different name."
  }
}
</i18n>
