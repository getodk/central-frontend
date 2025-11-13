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
  <modal id="entity-update" :state="state" :hideable="!awaitingResponse"
    size="large" backdrop @shown="afterShown" @hide="$emit('hide')">
    <template #title>{{ $t('title', currentVersion) }}</template>
    <template #body>
      <form @submit.prevent="submit">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th ref="labelCellHeader" class="label-cell">
                  <span class="sr-only">{{ $t('resource.property') }}</span>
                </th>
                <th ref="oldValueHeader" class="old-value">
                  {{ $t('header.currentValue') }}
                </th>
                <th class="new-value">{{ $t('header.updatedValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <entity-update-row ref="labelRow" v-model="label"
                :old-value="currentVersion.label"
                :label="$t('entity.entityLabel')" required/>
              <template v-if="dataset.dataExists">
                <entity-update-row v-for="{ name } of dataset.properties"
                  :key="name" ref="propertyRows" v-model="data[name]"
                  :old-value="currentVersion.data[name]" :label="name"/>
              </template>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.update') }} <spinner :state="awaitingResponse"/>
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

import useColumnGrow from '../../composables/column-grow';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { px, styleBox } from '../../util/dom';
import { useRequestData } from '../../request-data';

const { t } = useI18n();

defineOptions({
  name: 'EntityUpdate'
});
const props = defineProps({
  state: Boolean,
  entity: Object
});

const emit = defineEmits(['hide', 'success']);

const { dataset } = useRequestData();

const label = ref(undefined);
const data = ref(Object.create(null));
watch(() => props.state, (state) => {
  if (!state) {
    label.value = undefined;
    data.value = Object.create(null);
  }
});



const { request, awaitingResponse } = useRequest();
const submit = () => {
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

const labelCellHeader = ref(null);
const { resize: resizeLabelCells } = useColumnGrow(labelCellHeader, 1.5);
const oldValueHeader = ref(null);
const labelRow = ref(null);
// Resizes th.old-value so that the width of the old value and the width of the
// textarea value are the same. Before this resizing, th.old-value and
// th.new-value have the same width. We need to decrease the width of
// th.old-value to account for the padding and borders of the textarea.
const resizeOldValue = () => {
  // Remove any width that the function previously set.
  oldValueHeader.value.style.width = '';
  const { width } = oldValueHeader.value.getBoundingClientRect();
  const textarea = styleBox(getComputedStyle(labelRow.value.textarea.el));
  const paddingAndBorders = textarea.paddingLeft + textarea.paddingRight +
    textarea.borderLeft + textarea.borderRight;
  oldValueHeader.value.style.width = px(width - (paddingAndBorders / 2));
};
const propertyRows = ref([]);
const afterShown = () => {
  labelRow.value.textarea.focus();

  // Resize elements. We wait a tick in case props.entity was changed at the
  // same time as props.state. If a change to props.entity results in changes to
  // the DOM, we need those changes to the DOM to be made before resizing
  // elements based on content in the DOM.
  nextTick(() => {
    resizeLabelCells();
    resizeOldValue();

    labelRow.value.textarea.resize();
    for (const row of propertyRows.value) row.textarea.resize();
  });
};

const noEntity = {
  currentVersion: { label: '', data: {} }
};
const currentVersion = computed(() =>
  (props.entity ?? noEntity).currentVersion);
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-update {
  .modal-dialog { margin-top: 15vh; }
  .table-scroll {
    max-height: calc(70vh -
      #{/* .modal-header */ 46px + /* .modal-actions */ 100px});
    overflow-y: auto;
  }

  table { margin-bottom: 0; }

  table { table-layout: fixed; }
  thead {
    .label-cell { width: 16.66666667%; }
  }

  tr:nth-child(2) td { border-top-color: #bbb; }

  .alert { margin: 15px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Update {label}",
    // This is the text of a table column header. "Value" refers to the value of
    // an Entity property.
    "header": {
      "currentValue": "Current Value",
      "updatedValue": "Updated Value"
    },
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
    "problem": {
      "409_15": "資料已被另一用戶修改。請重新整理查看更新後的資料。"
    }
  }
}
</i18n>
