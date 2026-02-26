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
  <modal :id="modalId" :state="state" :hideable="!awaitingResponse"
    size="large" backdrop @shown="afterShown" @hide="$emit('hide')">
    <template #title>{{ isCreate ? $t('titleCreate') : $t('title', currentVersion) }}</template>
    <template #body>
      <div>{{ isCreate ? $t('createIntroduction[0]') : $t('introduction[0]') }}</div>
      <form @submit.prevent="submit">
        <table class="table">
          <tbody>
            <entity-update-row ref="labelRow" v-model="label"
              :old-value="currentVersion.label" :required="isCreate"/>
            </tbody>
        </table>
        <h4 id="properties-header">{{ $t('resource.properties') }}</h4>
        <div>{{ isCreate ? $t('createIntroduction[1]') : $t('introduction[1]') }}</div>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th class="label-cell">{{ $t('resource.property') }}</th>
                <th class="new-value">{{ $t('header.updatedValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="dataset.dataExists">
                <entity-update-row v-for="{ name } of dataset.properties"
                  :key="name" ref="propertyRows" v-model="data[name]"
                  :old-value="currentVersion.data[name]" :label="name"
                  :disabled="!isCreate && name === 'geometry' && geometryDisabled"
                  :disabled-message="$t('geometryDisabled')"/>
              </template>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ isCreate ? $t('action.neverMind') : $t('action.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ isCreate ? $t('action.create') : $t('action.update') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import EntityUpdateRow from './update/row.vue';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

const { t } = useI18n();

defineOptions({
  name: 'EntityUpdate'
});
const props = defineProps({
  state: Boolean,
  // An entity in the format of a REST response (not OData)
  entity: Object,
  create: Boolean,
  geometryDisabled: Boolean
});


const isCreate = computed(() => props.create);
const modalId = computed(() => (isCreate.value ? 'entity-create' : 'entity-update'));

const propertyRows = ref([]);
const labelRow = ref(null);

const label = ref(undefined);
const data = ref(Object.create(null));

const noEntity = {
  currentVersion: { label: '', data: {} }
};
const currentVersion = computed(() =>
  (props.entity ?? noEntity).currentVersion);

watch(() => props.state, (state) => {
  if (!state) {
    label.value = undefined;
    data.value = Object.create(null);
  }
});


// ----
// Resize text areas to fit content

const afterShown = () => {
  labelRow.value.textarea.focus();

  // Resize elements. We wait a tick in case props.entity was changed at the
  // same time as props.state. If a change to props.entity results in changes to
  // the DOM, we need those changes to the DOM to be made before resizing
  // elements based on content in the DOM.
  nextTick(() => {
    labelRow.value.textarea.resize();
    for (const row of propertyRows.value) row.textarea.resize();
  });
};

// ----
// Requests and modal behavior after sending requests

const emit = defineEmits(['hide', 'success']);

const { dataset } = useRequestData();

const { request, awaitingResponse } = useRequest();
const submit = () => {
  if (isCreate.value) {
    request.post(
      apiPaths.entities(dataset.projectId, dataset.name),
      { label: label.value, data: data.value },
    )
      .then(response => {
        emit('success', response.data);
      })
      .catch(noop);
    return;
  }

  const { entity } = props;
  const url = apiPaths.entity(dataset.projectId, dataset.name, entity.uuid, { baseVersion: entity.currentVersion.version });

  request.patch(
    url,
    { label: label.value, data: data.value },
    {
      problemToAlert: ({ code }) => {
        if (code === 409.15) return t('problem.409_15');
        return null;
      }
    }
  )
    .then(response => {
      // It is the responsibility of the parent component to patch the entity.
      emit('success', response.data);
    })
    .catch(noop);
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-update, #entity-create {
  #labelTextArea, th {
    font-size: 12px;
    margin-top: 10px;
  }

  .modal-dialog { margin-top: 15vh; }

  #properties-header {
    margin-top: 40px;
  }

  .table-scroll {
    max-height: calc(70vh -
      #{/* .modal-header */ 150px + /* .modal-actions */ 100px});
    overflow-y: auto;
  }

  table {
    margin-top: 10px;
    margin-bottom: 0;
    table-layout: fixed;
  }

  thead {
    background-color: white;
  }

  tr td, th {
    border: none;
    padding-left: 0px;
  }

  .alert { margin: 15px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Update {label}",
    "titleCreate": "Create New Entity",
    "createIntroduction": [
      "Name your new Entity",
      "Properties describe key details about your Entities."
    ],
    "introduction": [
      "Label your Entity",
      "Properties describe key details about your Entities."
    ],
    // This is the text of a table column header. "Value" refers to the value of
    // an Entity property.
    "header": {
      "currentValue": "Current Value",
      "updatedValue": "Updated Value"
    },
    "geometryDisabled": "Geometry can’t be updated from the map.",
    "problem": {
      "409_15": "Data has been modified by another user. Please refresh to see the updated data."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Aktualizace {label}",
    "header": {
      "currentValue": "Aktuální hodnota",
      "updatedValue": "Aktualizovaná hodnota"
    },
    "problem": {
      "409_15": "Data byla upravena jiným uživatelem. Aktualizujte prosím stránku, abyste viděli aktualizovaná data."
    }
  },
  "de": {
    "title": "Aktualisieren {label}",
    "header": {
      "currentValue": "Aktueller Wert",
      "updatedValue": "Aktualisierter Wert"
    },
    "geometryDisabled": "Die Geometrie kann nicht über die Karte aktualisiert werden.",
    "problem": {
      "409_15": "Die Daten wurden von einem anderen Benutzer geändert. Bitte aktualisieren Sie die Seite, um die aktualisierten Daten anzuzeigen."
    }
  },
  "es": {
    "title": "Actualizar {label}",
    "header": {
      "currentValue": "Valor actual",
      "updatedValue": "Valor actualizado"
    },
    "geometryDisabled": "La geometría no se puede actualizar desde el mapa.",
    "problem": {
      "409_15": "Los datos han sido modificados por otro usuario. Actualice para ver los datos actualizados."
    }
  },
  "fr": {
    "title": "Mise à jour {label}",
    "header": {
      "currentValue": "Valeur actuelle",
      "updatedValue": "Valeur Mise à jour"
    },
    "geometryDisabled": "La géométrie ne peut être modifiée depuis la carte.",
    "problem": {
      "409_15": "Les données ont été modifiées par un autre utilisateur. Merci de rafraîchir pour voir les données mises à jour."
    }
  },
  "it": {
    "title": "Aggiorna {label}",
    "header": {
      "currentValue": "Valore corrente",
      "updatedValue": "Valore aggiornato"
    },
    "geometryDisabled": "La geometria non può essere aggiornata dalla mappa.",
    "problem": {
      "409_15": "I dati sono stati modificati da un altro utente. Aggiornare per vedere i dati aggiornati."
    }
  },
  "pt": {
    "title": "Atualizar {label}",
    "header": {
      "currentValue": "Valor Atual",
      "updatedValue": "Valor Atualizado"
    },
    "problem": {
      "409_15": "Os dados foram modificados por outro usuário. Por favor, atualize a página para ver os dados atualizados."
    }
  },
  "sw": {
    "title": "Sasisha {label}",
    "header": {
      "currentValue": "Thamani ya Sasa",
      "updatedValue": "Thamani Iliyosasishwa"
    },
    "problem": {
      "409_15": "Data imerekebishwa na mtumiaji mwingine. Tafadhali onyesha upya ili kuona data iliyosasishwa."
    }
  },
  "zh": {
    "title": "更新{label}",
    "header": {
      "currentValue": "当前数值",
      "updatedValue": "更新后的数值"
    },
    "geometryDisabled": "无法通过地图更新几何数据。",
    "problem": {
      "409_15": "数据已被其他用户修改，请刷新以查看最新数据。"
    }
  },
  "zh-Hant": {
    "title": "更新{label}",
    "header": {
      "currentValue": "目前數值",
      "updatedValue": "更新數值"
    },
    "geometryDisabled": "無法透過地圖更新地理資料。",
    "problem": {
      "409_15": "資料已被另一用戶修改。請重新整理查看更新後的資料。"
    }
  }
}
</i18n>
