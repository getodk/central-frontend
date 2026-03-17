<!--
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<template>
  <modal id="delete-property-error-modal" :state="state" backdrop hideable @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div v-if="state && errorObject" class="modal-introduction">
        <i18n-t tag="p" keypath="intro">
          <template #propertyName>{{ errorObject.details.propertyName }}</template>
          <template #actions>
            <i18n-t v-if="nonEmptyEntities" keypath="clearEntities">
              <template #entities>
                <strong>{{ $t('entitiesCount', nonEmptyEntities.details.totalCount) }}</strong>
              </template>
            </i18n-t>
            <template v-if="nonEmptyEntities && dependentForms">&nbsp;{{ $t('and') }}&nbsp;</template>
            <i18n-t v-if="dependentForms" keypath="unlinkForms">
              <template #forms>
                <strong>{{ $t('formsCount', dependentForms.details.forms.length) }}</strong>
              </template>
            </i18n-t>
          </template>
        </i18n-t>
        <details v-if="nonEmptyEntities" open>
          <summary>
            {{ $t('relatedToEntities', nonEmptyEntities.details.totalCount) }}
            <span class="icon-chevron-down"></span>
          </summary>
          <ul>
            <li v-for="entity in nonEmptyEntities.details.entities" :key="entity.uuid">
              <router-link :to="entityPath(projectId, datasetName, entity.uuid)" target="_blank">{{ entity.label }}</router-link>
            </li>
          </ul>
          <p v-if="nonEmptyEntities.details.totalCount > 3" class="more-entities">
            {{ $t('moreEntities', nonEmptyEntities.details.totalCount - 3) }}
          </p>
        </details>
        <details v-if="dependentForms" open>
          <summary>
            {{ $t('relatedToForms', dependentForms.details.forms.length) }}
            <span class="icon-chevron-down"></span>
          </summary>
          <ul>
            <li v-for="form in dependentForms.details.forms" :key="form.xmlFormId">
              <router-link :to="formPath(projectId, form.xmlFormId, 'draft')" target="_blank">{{ form.formName }}</router-link>
            </li>
          </ul>
        </details>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-default" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed } from 'vue';

import Modal from '../../modal.vue';

import useRoutes from '../../../composables/routes';

defineOptions({
  name: 'DeletePropertyError'
});

const props = defineProps({
  state: {
    type: Boolean,
    required: true
  },
  projectId: [Number, String],
  datasetName: String,
  errorObject: Object,
});
const { formPath, entityPath } = useRoutes();

const nonEmptyEntities = computed(() => (props.errorObject ? props.errorObject.details.prerequisites.nonEmptyEntities : null));
const dependentForms = computed(() => (props.errorObject ? props.errorObject.details.prerequisites.dependentForms : null));
defineEmits(['hide']);
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#delete-property-error-modal{
  details {
    summary {
      cursor: pointer;
      list-style: none;
      font-weight: bold;
      padding: 10px 0;
      color: $color-action-foreground;

      .icon-chevron-down {
        display: inline-block;
        margin-right: 6px;
      }
    }

    &[open] summary .icon-chevron-down {
      transform: rotate(0deg);
    }

    &:not([open]) summary .icon-chevron-down {
      transform: rotate(-90deg);
    }
  }
  .more-entities {
    margin-left: 20px;
    margin-bottom: 10px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Delete Property",
    "intro": "Before you can delete the Property “{propertyName}”, you’ll need to {actions}.",
    // {entities} is a bold count like "2 Entities"
    "clearEntities": "clear its value in {entities}",
    "and": "and",
    // {forms} is a bold count like "5 Forms"
    "unlinkForms": "unlink {forms} that set it",
    "entitiesCount": "{count} Entity | {count} Entities",
    "relatedToEntities": "Related to {count} Entity | Related to {count} Entities",
    "moreEntities": "and {count} more Entity | and {count} more Entities",
    "formsCount": "{count} Form | {count} Forms",
    "relatedToForms": "Related to {count} Form | Related to {count} Forms"
  }
}
</i18n>
