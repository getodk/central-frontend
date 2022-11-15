<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <multiselect id="submission-filters-review-state" :model-value="modelValue"
    :options="options" :label="$t('field.reviewState')"
    :placeholder="placeholder" :all="$t('action.select.all')"
    :none="$t('action.select.none')" @update:model-value="update"/>
</template>

<script>
export default {
  name: 'SubmissionFiltersReviewState'
};
</script>
<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Multiselect from '../../multiselect.vue';

import useReviewState from '../../../composables/review-state';
import { odataLiteral } from '../../../util/odata';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);

const { reviewStates } = useReviewState();
const { i18n: globalI18n } = inject('container');
const options = reviewStates.map(reviewState => ({
  value: odataLiteral(reviewState),
  text: globalI18n.t(`reviewState.${reviewState}`)
}));

const selectValue = ref(props.modelValue);
watch(() => props.modelValue, (value) => { selectValue.value = value; });
const update = (value) => {
  if (value.length !== 0)
    emit('update:modelValue', value);
  // If no review states are selected, then the selection falls back to all
  // review states. But if that's the selection already, then there is no change
  // to emit.
  else if (props.modelValue.length !== reviewStates.length)
    emit('update:modelValue', reviewStates);
};

const { t } = useI18n();
const placeholder = (counts) => t('placeholder', counts);
</script>

<i18n lang="json5">
{
  "en": {
    // This is the text of a dropdown that allows the user to select one or more
    // Review States. {selected} is the number of selected Review States;
    // {total} is the total number of Review States.
    "placeholder": "{selected} of {total}",
    "action": {
      "select": {
        /* This text is shown in a dropdown that allows the user to select one
        or more Review States. It will be inserted where {all} is in the
        following text:

        Select {all} / {none} */
        "all": "All",
        /* This text is shown in a dropdown that allows the user to select one
        or more Review States. It will be inserted where {none} is in the
        following text:

        Select {all} / {none} */
        "none": "None"
      }
    }
  }
}
</i18n>
