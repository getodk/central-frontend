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
  <table v-if="properties.length > 0" id="dataset-properties" class="table">
    <thead>
      <tr>
        <th class="col-prop-name">{{ $t('header.name') }}</th>
        <th class="col-actions"></th>
        <th>{{ $t('header.updatedBy') }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(property) in properties" :key="property.name">
        <tr>
          <!-- we have to show property name even if there is no associated form -->
          <td :rowspan="property.forms.length || 1" class="col-prop-name">
            {{ property.name }}
          </td>
          <td :rowspan="property.forms.length || 1" class="col-actions">
            <button v-if="project.verbs.has('dataset.update')" type="button"
              class="delete-button btn btn-default" :aria-label="$t('action.delete')"
              v-tooltip.aria-label @click="showDeleteConfirmation(property.name)">
              <span class="icon-trash"></span>
            </button>
          </td>
          <td>
            <form-link v-if="property.forms.length > 0"
              :form="property.forms[0]"
              :to="publishedFormPath(property.forms[0].projectId, property.forms[0].xmlFormId)"
              v-tooltip.text/>
            <div v-else class="empty-update-form">{{ $t('none') }}</div>
          </td>
        </tr>
        <template v-for="(form, index) in property.forms" :key="form.xmlFormId">
          <tr v-if="index > 0">
            <td>
              <form-link :form="form"
                :to="publishedFormPath(form.projectId, form.xmlFormId)"
                v-tooltip.text/>
            </td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>
  <p v-show="properties.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

  <confirmation v-bind="confirmDeleteModal" @hide="hideDeleteConfirmation" @success="deleteProperty">
    <template #body>
      <p>
        {{ $t('confirmation.body', { propertyName: propertyToBeDeleted }) }}
      </p>
    </template>
  </confirmation>
  <delete-property-error v-bind="deletePropertyErrorModal"
    @hide="deletePropertyErrorModal.hide()"/>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Confirmation from '../../confirmation.vue';
import DeletePropertyError from './delete-property-error.vue';
import FormLink from '../../form/link.vue';

import useRoutes from '../../../composables/routes';
import { useRequestData } from '../../../request-data';
import { modalData } from '../../../util/reactivity';
import useRequest from '../../../composables/request';
import { apiPaths, isProblem } from '../../../util/request';
import { noop } from '../../../util/util';

const { request, awaitingResponse } = useRequest();
const alert = inject('alert');

const { t } = useI18n();

defineOptions({
  name: 'DatasetProperties'
});

const { dataset, project } = useRequestData();
const properties = computed(() => dataset.properties);

const { publishedFormPath } = useRoutes();

const confirmDeleteModalState = modalData();

const propertyToBeDeleted = ref('');

const confirmDeleteModal = computed(() => ({
  state: confirmDeleteModalState.state,
  title: t('confirmation.title'),
  yesText: t('confirmation.confirm'),
  awaitingResponse: awaitingResponse.value
}));

const showDeleteConfirmation = (propertyName) => {
  confirmDeleteModalState.show();
  propertyToBeDeleted.value = propertyName;
};

const hideDeleteConfirmation = () => {
  confirmDeleteModalState.hide();
  propertyToBeDeleted.value = '';
};

const deletePropertyErrorModal = modalData();

const deleteProperty = () => {
  request({
    method: 'DELETE',
    url: apiPaths.datasetProperty(project.id, dataset.name, propertyToBeDeleted.value),
    fulfillProblem: ({ code }) => code === 409.22,
  })
    .then(({ data }) => {
      if (isProblem(data)) {
        deletePropertyErrorModal.show({ projectId: project.id, datasetName: dataset.name, errorObject: data });
        hideDeleteConfirmation();
      } else {
        dataset.properties = dataset.properties.filter(p => p.name !== propertyToBeDeleted.value);
        alert.success(t('deleted', { name: propertyToBeDeleted.value }));
        hideDeleteConfirmation();
      }
    })
    .catch(noop);
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';
@import '../../../assets/scss/variables';

#dataset-properties {
  &.table{
    table-layout: fixed;

    td {
      overflow-wrap: break-word;
    }

    > tbody > tr:first-child > td {
      border-top: none;
    }

    a {
      font-size: 16px;
    }
  }

  .empty-update-form {
    @include italic;
    color: #888;
  }

  .col-prop-name {
    width: 25%;
  }

  .col-actions {
    width: 25%;
  }

  .delete-button [class^="icon-"] {
    margin-right: 0;
    color: $color-danger;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      "emptyTable": "The Entities in this Entity List do not have any user-defined properties.",
      // This is shown in an Entity property row in a column about Forms, and 'None' refers to Forms.
      "none": "(None)",
      "confirmation": {
        "title": "Delete Property",
        // This is shown on a confirmation dialog box. {propertyName} is the name of the property that is being deleted.
        "body": "Are you sure you want to delete the Property “{propertyName}”? This cannot be undone.",
        "confirm": "@:action.delete",
      },
      // This is shown after a Property has been successfully deleted. {name} is the name of the deleted property.
      "deleted": "Property “{name}” has been deleted."
    }
  }
  </i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "emptyTable": "Entity v tomto seznamu entit nemají žádné uživatelsky definované vlastnosti.",
    "none": "(žádný)"
  },
  "de": {
    "emptyTable": "Die Objekte in dieser Objektliste verfügen über keine benutzerdefinierten Eigenschaften.",
    "none": "(Keine)"
  },
  "es": {
    "emptyTable": "Las entidades de esta lista no tienen propiedades definidas por el usuario.",
    "none": "(ninguno)"
  },
  "fr": {
    "emptyTable": "Les entités dans cette liste n'ont pas de propriétés définies par l'utilisateur",
    "none": "Aucun"
  },
  "it": {
    "emptyTable": "Le entità di questo elenco di entità non hanno proprietà definite dall'utente.",
    "none": "(Nessuna)"
  },
  "pt": {
    "emptyTable": "As Entidades nesta Lista de Entidades não têm nenhuma propriedade definida pelo usuário.",
    "none": "(Nenhum)"
  },
  "sw": {
    "emptyTable": "Huluki katika Orodha hii ya Huluki hazina sifa zozote zilizobainishwa na mtumiaji."
  },
  "zh": {
    "emptyTable": "该实体清单中的实体没有任何使用者定义的属性。",
    "none": "（无）"
  },
  "zh-Hant": {
    "emptyTable": "此實體清單中的實體沒有任何使用者定義的屬性。",
    "none": "(無)"
  }
}
</i18n>
