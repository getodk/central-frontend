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
  <div id="entity-download-button" class="dropdown">
    <a class="btn btn-primary" :class="{ disabled }" :href="href"
      :data-toggle="odataFilter ? 'dropdown' : null">
      <span class="icon-arrow-circle-down"></span>
      <span>{{ $t('action.download') }}</span>
    </a>
    <ul class="dropdown-menu dropdown-menu-right">
      <li>
        <a class="btn btn-link dropdown-item" :href="filteredHref">
          <span>{{ downloadFiltered }}</span>
        </a>
      </li>
      <li v-if="dataset.dataExists">
        <a class="btn btn-link dropdown-item" :href="href">
          <span>{{ $tcn('action.download.unfiltered', dataset.entities) }}</span>
        </a>
      </li>
    </ul>
</div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import { apiPaths } from '../../util/request';
import { useI18nUtils } from '../../util/i18n';
import { useRequestData } from '../../request-data';

const props = defineProps({
  odataFilter: String,
  disabled: Boolean
});

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const href = computed(() =>
  apiPaths.entities(projectId, datasetName, '.csv'));

const filteredHref = computed(() =>
  apiPaths.entities(projectId, datasetName, '.csv', { $filter: props.odataFilter }));

const { dataset, odataEntities } = useRequestData();
const { t } = useI18n();
const { tn } = useI18nUtils();
const downloadFiltered = computed(() => (odataEntities.dataExists
  ? tn('action.download.filtered.withCount', odataEntities.count)
  : t('action.download.filtered.withoutCount')));
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-download-button{
  .btn-primary {
    display: block;
  }

  .dropdown-item {
    width: 100%;
    text-align: left;
    color: $color-text;

    &:hover {
      color: #262626;
      text-decoration: none;
      background-color: #f5f5f5;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // @transifexKey component.EntityList.action.download
      "download": {
        "unfiltered": "Download {count} Entity | Download all {count} Entities",
        "filtered": {
          "withCount": "Download {count} Entity matching the filter | Download {count} Entities matching the filter",
          // This is the text of a button. This text is shown when the number of
          // matching Entities is unknown.
          "withoutCount": "Download all Entities matching the filter"
        }
      }
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "action": {
      "download": {
        "unfiltered": "{count} Entität herunterladen | Alle {count} Entitäten herunterladen",
        "filtered": {
          "withCount": "{count} Entität herunterladen, die dem Filter entsprechen | {count} Entitäten herunterladen, die dem Filter entsprechen",
          "withoutCount": "Alle Entitäten herunterladen, die dem Filter entsprechen"
        }
      }
    }
  },
  "es": {
    "action": {
      "download": {
        "unfiltered": "Descargar {count} Entidad | Descargar todas las {count} Entidades | Descargar todas las {count} Entidades",
        "filtered": {
          "withCount": "Descargar {count} Entidad que coincide con el filtro | Descargar {count} entidades que coincidan con el filtro | Descargar {count} entidades que coincidan con el filtro",
          "withoutCount": "Descargar todas las entidades que coincidan con el filtro"
        }
      }
    }
  },
  "fr": {
    "action": {
      "download": {
        "unfiltered": "Télécharger {count} entité (toutes) | Télécharger {count} entités (toutes) | Télécharger {count} entités (toutes)",
        "filtered": {
          "withCount": "Télécharger {count} entité filtrée | Télécharger {count} entités filtrées | Télécharger {count} entités filtrées",
          "withoutCount": "Télécharger toutes les entitées filtrées"
        }
      }
    }
  },
  "it": {
    "action": {
      "download": {
        "unfiltered": "Scarica {count} entità | Scarica tutte le {count} entità | Scarica tutte le {count} entità",
        "filtered": {
          "withCount": "Scaricare la {count} Entità che corrisponde al filtro | Scaricare le {count} Entità che corrispondono al filtro | Scaricare le {count} Entità che corrispondono al filtro",
          "withoutCount": "Scaricare tutte le Entità che corrispondono al filtro"
        }
      }
    }
  },
  "pt": {
    "action": {
      "download": {
        "unfiltered": "Baixar {count} Entidade | Baixar todas as {count} Entidades | Baixar todas as {count} Entidades",
        "filtered": {
          "withoutCount": "Baixar todas as Entidades correspondentes"
        }
      }
    }
  },
  "zh-Hant": {
    "action": {
      "download": {
        "unfiltered": "下載所有{count}個實體",
        "filtered": {
          "withCount": "下載符合篩選條件的{count}個實體",
          "withoutCount": "下載符合篩選條件的所有實體"
        }
      }
    }
  }
}
</i18n>
