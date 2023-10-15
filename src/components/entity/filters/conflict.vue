<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <multiselect id="entity-filters-conflict" :model-value="modelValue"
    :options="options" default-to-all :label="$t('field.conflict')"
    :placeholder="placeholder" :all="$t('action.select.all')"
    :none="$t('action.select.none')"
    @update:model-value="$emit('update:modelValue', $event)"/>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Multiselect from '../../multiselect.vue';

defineOptions({
  name: 'EntityFiltersConflict'
});
defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});
defineEmits(['update:modelValue']);

const { t } = useI18n();
const options = computed(() => [true, false].map(value =>
  ({ value, text: t(`conflict.${value}`) })));
const placeholder = (counts) => t('placeholder', counts);
</script>

<i18n lang="json5">
{
  "en": {
    // This is an option in a dropdown that allows the user to select one or
    // more conflict statuses.
    "conflict": {
      "true": "Possible conflict",
      "false": "No conflict"
    },
    "field": {
      "conflict": "Conflict status"
    },
    // This is the text of a dropdown that allows the user to select one or more
    // conflict statuses. {selected} is the number of selected conflict
    // statuses; {total} is the total number of conflict statuses.
    "placeholder": "{selected} of {total}",
    "action": {
      "select": {
        /*
        This text is shown in a dropdown that allows the user to select one or
        more conflict statuses. It will be inserted where {all} is in the
        following text:

        Select {all} / {none}
        */
        "all": "All",
        /*
        This text is shown in a dropdown that allows the user to select one or
        more conflict statuses. It will be inserted where {none} is in the
        following text:

        Select {all} / {none}
        */
        "none": "None"
      }
    }
  }
}
</i18n>
