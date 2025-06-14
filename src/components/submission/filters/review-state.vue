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
    :options="options" default-to-all :label="$t('common.reviewState')"
    :placeholder="placeholder" :all="$t('action.all')"
    :none="$t('action.none')"
    @update:model-value="$emit('update:modelValue', $event)"/>
</template>

<script setup>
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

import Multiselect from '../../multiselect.vue';

import useReviewState from '../../../composables/review-state';
import { odataLiteral } from '../../../util/odata';

defineOptions({
  name: 'SubmissionFiltersReviewState'
});
defineProps({
  modelValue: {
    type: Array,
    required: true
  }
});
defineEmits(['update:modelValue']);

const { reviewStates } = useReviewState();
const { i18n: globalI18n } = inject('container');
const options = reviewStates.map(reviewState => ({
  value: odataLiteral(reviewState),
  text: globalI18n.t(`reviewState.${reviewState}`)
}));

const { t } = useI18n();
const placeholder = (counts) => {
  if (counts.total === counts.selected) return t('action.all');
  return counts.selected;
};
</script>

<style lang="scss">
#submission-filters-review-state .none {
  font-style: italic;
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      /*
      This is the text of the button in dropdown menu of Review States filter,
      that allows the user to select all Review States.
      */
      "all": "All",
      /*
      This is the text of the button in dropdown menu of Review States filter,
      that allows the user to unselect all Review States.
      */
      "none": "None"
    },
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "placeholder": "{selected} z {total}",
    "action": {
      "select": {
        "all": "Vše",
        "none": "Nic"
      }
    }
  },
  "de": {
    "placeholder": "{selected} von {total}",
    "action": {
      "select": {
        "all": "Alle",
        "none": "Keine"
      }
    },
    "allReviewStateSelected": "(Alle)"
  },
  "es": {
    "placeholder": "{selected} de {total}",
    "action": {
      "select": {
        "all": "Todos",
        "none": "Ninguno"
      }
    },
    "allReviewStateSelected": "(Todos)"
  },
  "fr": {
    "placeholder": "{selected} sur {total}",
    "action": {
      "select": {
        "all": "Tous",
        "none": "Aucun"
      }
    },
    "allReviewStateSelected": "(Tous)"
  },
  "id": {
    "placeholder": "{selected} dari {total}",
    "action": {
      "select": {
        "all": "Semua",
        "none": "Tidak Ada"
      }
    }
  },
  "it": {
    "placeholder": "{selected} di {total}",
    "action": {
      "select": {
        "all": "Tutto",
        "none": "Nessuno/a"
      }
    },
    "allReviewStateSelected": "(Tutto)"
  },
  "pt": {
    "placeholder": "{selected} de {total}",
    "action": {
      "select": {
        "all": "Todos",
        "none": "Nenhum"
      }
    }
  },
  "sw": {
    "placeholder": "{selected} kati ya {total}",
    "action": {
      "select": {
        "all": "Wote",
        "none": "Hakuna"
      }
    }
  },
  "zh-Hant": {
    "placeholder": "{selected} /{total}",
    "action": {
      "select": {
        "all": "全部",
        "none": "無"
      }
    }
  }
}
</i18n>
