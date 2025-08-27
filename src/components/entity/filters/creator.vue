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
  <multiselect id="entity-filters-creator" :model-value="selectValue" :options="options"
    :loading="entityCreators.initiallyLoading" :label="$t('field.creator')" :placeholder="placeholder"
    :all="$t('action.all')" :none="$t('action.none')" :search="$t('field.search')" :empty="$t('emptyTable')"
    @update:model-value="update">
    <template #icon>
      <span class="icon-user"></span>
    </template>
  </multiselect>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Multiselect from '../../multiselect.vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityFiltersCreator'
});
const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);

// The component does not assume that this data will exist when the
// component is created.
const { entityCreators } = useRequestData();

const { t } = useI18n();
const unknown = computed(() => props.modelValue.reduce(
  (set, id) => (entityCreators.ids.has(id) ? set : set.add(id)),
  new Set()
));
const options = computed(() => {
  if (!entityCreators.dataExists) return null;
  const result = new Array(entityCreators.length + unknown.value.size);
  let i = 0;
  for (const id of unknown.value) {
    result[i] = { value: id, text: t('unknown') };
    i += 1;
  }
  for (const { id, displayName } of entityCreators) {
    result[i] = { value: id, text: displayName };
    i += 1;
  }
  return result;
});

const selectValue = ref(props.modelValue);
watch(() => props.modelValue, (value) => { selectValue.value = value; });
const update = (value) => {
  if (unknown.value.size !== 0) {
    // Filter out unknown creators. If that results in no creators, then
    // fall back to all creators.
    const withoutUnknown = value.filter(id => !unknown.value.has(id));
    emit('update:modelValue', withoutUnknown.length !== 0
      ? withoutUnknown
      : [...entityCreators.ids]);
  } else if (value.length !== 0) {
    emit('update:modelValue', value);
  } else {
    // If no creators are selected, then the selection falls back to all
    // creators. If that's not the selection already, then we emit all
    // creators. Otherwise, there's no change to emit, but we still need to
    // make a temporary change to selectValue in order to force the Multiselect
    // to recheck the checkboxes.
    const all = [...entityCreators.ids];
    if (props.modelValue.length !== all.length) {
      emit('update:modelValue', all);
    } else {
      selectValue.value = value;
      nextTick(() => { selectValue.value = all; });
    }
  }
};

const placeholder = (counts) => {
  if (counts.total === counts.selected) return t('action.all');

  return counts.selected;
};
</script>

<style lang="scss">
#entity-filters-creator .none {
  font-style: italic;
}
</style>

<i18n lang="json5">
{
  "en": {
    "field": {
      // This is the text of a form field that shows the names of users that have created Entities.
      "creator": "Created by",
      "search": "Search creators…"
    },
    "action": {
      /*
      This is the text of the button in dropdown menu of entity "created by" filter,
      that allows the user to select all creators.
      */
      "all": "All",
      /*
      This is the text of the button in dropdown menu of creator filter,
      that allows the user to unselect all creators.
      */
      "none": "None"
    },
    "unknown": "Unknown creator",
    "emptyTable": "There are no Entities yet."
  }
}
</i18n>
