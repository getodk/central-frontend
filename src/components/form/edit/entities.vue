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
  <form-edit-section id="form-edit-entities" icon="database">
    <template #title>{{ $t('resource.entities') }}</template>
    <template #body>
      <template v-if="formDraft.entityRelated">
        <loading :state="datasetDiff.initiallyLoading"/>
        <template v-if="datasetDiff.dataExists">
          <p>{{ $tcn('datasetCount', datasetDiff.length) }}</p>
          <p v-if="datasetDiff.counts.updatedDatasets !== 0"
            id="form-edit-entities-diff-counts">
            <span>{{ diffCounts }}</span>
            <template v-if="datasetDiff.counts.newProperties !== 0">
              <sentence-separator/>
              <span>{{ $t('cannotDeleteProperties') }}</span>
            </template>
          </p>
          <dataset-summary is-draft/>
        </template>
      </template>
      <p v-else>
        <span>{{ $t('notEntityRelated') }}</span>
        <sentence-separator/>
        <doc-link to="central-entities/">{{ $t('whatAreEntities') }}</doc-link>
      </p>
    </template>
  </form-edit-section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import DatasetSummary from '../../dataset/summary.vue';
import DocLink from '../../doc-link.vue';
import FormEditSection from './section.vue';
import Loading from '../../loading.vue';
import SentenceSeparator from '../../sentence-separator.vue';

import { useI18nUtils } from '../../../util/i18n';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'FormEditEntities'
});

const { formDraftDatasetDiff: datasetDiff, resourceView } = useRequestData();
const formDraft = resourceView('formDraft', (data) => data.get());

const { t } = useI18n();
const { tn } = useI18nUtils();
const diffCounts = computed(() => {
  const { updatedDatasets, newProperties } = datasetDiff.counts;
  return newProperties === 0
    ? tn('diffCounts.datasetsOnly', updatedDatasets)
    : t('diffCounts.newProperties.full', {
      entityLists: tn('diffCounts.newProperties.entityLists', updatedDatasets),
      properties: tn('diffCounts.newProperties.properties', newProperties)
    });
});
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#form-edit-entities {
  .dataset-summary { margin-top: -$padding-top-expandable-row; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "datasetCount": "Submissions to this Form definition will update {count} Entity List. | Submissions to this Form definition will update {count} Entity Lists.",
    "diffCounts": {
      "datasetsOnly": "Publishing this draft will update {count} Entity List. | Publishing this draft will update {count} Entity Lists.",
      "newProperties": {
        "full": "Publishing this draft will update {entityLists} and create {properties}.",
        "entityLists": "{count} Entity List | {count} Entity Lists",
        "properties": "{count} property | {count} properties"
      }
    },
    // "Properties" refers to Entity properties.
    "cannotDeleteProperties": "Properties cannot be deleted.",
    // "Definition" refers to a Form Definition.
    "notEntityRelated": "This definition does not update any Entities.",
    "whatAreEntities": "What are Entities?"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "cannotDeleteProperties": "Eigenschaften können nicht gelöscht werden.",
    "notEntityRelated": "Mit dieser Definition werden keine Entitäten aktualisiert.",
    "whatAreEntities": "Was sind Entitäten?"
  },
  "es": {
    "datasetCount": "Los envíos a esta definición de formulario actualizarán {count} Lista de entidades. | Los envíos a esta definición de formulario actualizarán {count} Listas de entidades. | Los envíos a esta definición de formulario actualizarán {count} Listas de entidades.",
    "diffCounts": {
      "datasetsOnly": "La publicación de este borrador actualizará {count} Lista de entidades | La publicación de este borrador actualizará {count} Listas de entidades | La publicación de este borrador actualizará {count} Listas de entidades",
      "newProperties": {
        "full": "La publicación de este borrador actualizará {entityLists} y creará {properties}",
        "entityLists": "{count} Lista de entidades | {count} Listas de entidades | {count} Listas de entidades",
        "properties": "{count} propiedad | {count} propiedades | {count} propiedades"
      }
    },
    "cannotDeleteProperties": "Las propiedades no pueden borrarse.",
    "notEntityRelated": "Esta definición no actualiza ninguna Entidad.",
    "whatAreEntities": "¿Qué son las entidades?"
  },
  "fr": {
    "datasetCount": "Les soumissions à cette définition de Formulaire mettront à jour {count} liste d'entités. | Les soumissions à cette définition de Formulaire mettront à jour {count} listes d'entités. | Les soumissions à cette définition de Formulaire mettront à jour {count} liste(s) d'entités.",
    "diffCounts": {
      "datasetsOnly": "Publier cette ébauche mettra à jour {count} liste d'entités. | Publier cette ébauche mettra à jour {count} listes d'entités. | Publier cette ébauche mettra à jour {count} liste(s) d'entités.",
      "newProperties": {
        "full": "Publier cette ébauche mettra à jour {entityLists} liste(s) d'entités et créera {properties}.",
        "entityLists": "{count} Liste d'Entités | {count} Listes d'Entités | {count} Liste(s) d'Entités",
        "properties": "{count} propriété | {count} propriétés | {count} propriété(s)"
      }
    },
    "cannotDeleteProperties": "Les propriétés ne peuvent être supprimées.",
    "notEntityRelated": "Cette définition ne met pas à jour d'Entités.",
    "whatAreEntities": "Que sont les Entités ?"
  },
  "it": {
    "datasetCount": "Gli invii a questa definizione di formulario aggiornerà {count} Elenco di entità | Gli invii a questa definizione di formulario aggiorneranno {count} Elenco delle entità | Gli invii a questa definizione di formulario aggiorneranno {count} Elenco delle entità",
    "diffCounts": {
      "datasetsOnly": "La pubblicazione di questa bozza aggiornerà {count} Elenco delle entità | La pubblicazione di questa bozza aggiornerà {count} Elenco delle entità | La pubblicazione di questa bozza aggiornerà {count} Elenco delle entità",
      "newProperties": {
        "full": "La pubblicazione di questa bozza aggiornerà {entityLists} e creerà {properties}",
        "entityLists": "{count} Elenco di entità | {count} Elenchi di entità | {count} Elenchi di entità",
        "properties": "{count} proprietà | {count} proprietà | {count} proprietà"
      }
    },
    "cannotDeleteProperties": "Le proprietà non possono essere eliminate.",
    "notEntityRelated": "Questa definizione non aggiorna alcuna entità.",
    "whatAreEntities": "Cosa sono le entità?"
  },
  "pt": {
    "whatAreEntities": "O que são Entidades?"
  },
  "zh-Hant": {
    "datasetCount": "提交此表格定義將更新{count}個實體清單。",
    "diffCounts": {
      "datasetsOnly": "發布此草案將更新{count}個實體清單。",
      "newProperties": {
        "full": "發布此草案將更新{entityLists}並創建{properties}。",
        "entityLists": "{count}個實體清單",
        "properties": "{count}種屬性"
      }
    },
    "cannotDeleteProperties": "屬性無法刪除。",
    "notEntityRelated": "此定義不會更新任何實體。",
    "whatAreEntities": "什麼是實體？"
  }
}
</i18n>
