<template>
  <multiselect id="entity-filters-view-as" single :model-value="selectValue"
    :options="options" :loading="fieldKeys.initiallyLoading" :label="$t('viewAs')"
    :placeholder="placeholder" :clear="$t('resetToMe')" :search="$t('search')"
    :disabled="disabled" :disabled-message="disabledMessage" @update:model-value="update">
  </multiselect>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Multiselect from '../../multiselect.vue';

import { useRequestData } from '../../../request-data';

const { t } = useI18n();

defineOptions({
  name: 'EntityFiltersViewAs'
});
const props = defineProps({
  modelValue: {
    type: Number,
    required: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  disabledMessage: {
    type: String,
    required: false
  }
});
const { fieldKeys } = useRequestData();

const options = computed(() => (fieldKeys.dataExists
  ? fieldKeys.data.map(({ id, displayName }) => ({ value: id, text: displayName }))
  : null));
const selectValue = computed(() => {
  if (!fieldKeys.dataExists || props.modelValue == null) return [];
  return fieldKeys.data.some(fieldKey => fieldKey.id === props.modelValue)
    ? [props.modelValue]
    : [];
});

const emit = defineEmits(['update:modelValue']);
const update = (value) => { emit('update:modelValue', value[0] ?? null); };
const placeholder = ({ selectedText }) => selectedText ?? t('noUserSelected');
</script>

<i18n lang="json5">
{
  "en": {
    "noUserSelected": "Me",
    "viewAs": "View As",
    "resetToMe": "Reset to Me",
    "search": "Search App Users…"
  }
}
</i18n>
