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
    "relatedToEntities": "Set in {count} Entity | Set in {count} Entities",
    "moreEntities": "and {count} more Entity | and {count} more Entities",
    "formsCount": "{count} Form | {count} Forms",
    "relatedToForms": "Set by {count} Form | Set by {count} Forms"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "Eigenschaft löschen",
    "intro": "Bevor Sie die Eigenschaft löschen können “{propertyName}”, Sie müssen {actions}.",
    "clearEntities": "seinen Wert in {entities} löschen",
    "and": "und",
    "unlinkForms": "die Verknüpfung zu dem {forms}aufheben, das es festgelegt hat",
    "entitiesCount": "{count} Objekt | {count} Objekte",
    "relatedToEntities": "In Verbindung mit {count} Entität | In Verbindung mit {count} Entitäten",
    "moreEntities": "und {count}weitere Entität | und {count} weitere Entitäten",
    "formsCount": "{count} Formular | {count} Formulare",
    "relatedToForms": "In Verbindung mit {count} Formular | In Verbindung mit {count} Formularen"
  },
  "es": {
    "title": "Borrar propiedad",
    "intro": "Antes de poder eliminar la propiedad “{propertyName}”, tendrás que{actions}.",
    "clearEntities": "eliminar su valor en {entities}",
    "and": "y",
    "unlinkForms": "desvincular {forms}que lo configuró",
    "entitiesCount": "{count}entidad | {count} entidades | {count} entidades",
    "relatedToEntities": "Relacionado con{count} Entidad | Relacionado con {count}Entidades | Relacionado con {count} Entidades",
    "moreEntities": "y otra {count} entidad | y otras {count}entidades | y otras {count} entidades",
    "formsCount": "{count} formulario | {count} formularios | {count} formularios",
    "relatedToForms": "Relacionado con{count} formulario | Relacionado con {count}formularios | Relacionado con {count} formularios"
  },
  "fr": {
    "title": "Supprimer la propriété",
    "intro": "Avant de pouvoir supprimer la propriété \"{propertyName}\", vous devrez {actions}."
  },
  "it": {
    "title": "Elimina proprietà",
    "intro": "Prima di eliminare la proprietà “{propertyName}”, devi{actions}.",
    "clearEntities": "cancellare il suo valore in {entities}",
    "and": "e",
    "unlinkForms": "rimuovere il collegamento ai {forms} che lo definiscono",
    "entitiesCount": "{count}Entità | {count}Entità | {count} Entità",
    "relatedToEntities": "Correlato a {count} Entità | Correlato a {count} Entità | Correlato a {count} Entità",
    "moreEntities": "e{count} Entità in più | e {count}Entità in più | e{count} Entità in più",
    "formsCount": "{count} Formulario | {count} Formulari | {count} Formulari",
    "relatedToForms": "Correlato a {count} Formulario | Correlato a {count} Formulari | Correlato a {count} Formulari"
  },
  "zh": {
    "title": "删除属性",
    "intro": "在删除属性“{propertyName}”之前，您需要先{actions}",
    "clearEntities": "清除其在{entities}中的值",
    "and": "和",
    "unlinkForms": "取消设置该属性的{forms}的关联",
    "entitiesCount": "{count} 个实体",
    "relatedToEntities": "与 {count} 个实体相关",
    "moreEntities": "以及其他 {count} 个实体",
    "formsCount": "{count} 个表单",
    "relatedToForms": "与 {count} 个表单相关"
  }
}
</i18n>
