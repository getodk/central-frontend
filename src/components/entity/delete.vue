<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="entity-delete" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusCheckbox">
    <template #title>{{ $t('title', { label: entity?.label }) }}</template>
    <template #body>
      <p class="modal-introduction">
        <span>{{ $t('introduction[0]', { label: entity?.label }) }}</span>
      </p>
      <form v-if="checkbox">
        <div class="checkbox">
          <label>
            <input ref="input" v-model="noConfirm" type="checkbox">
            {{ $t('field.noConfirm') }}
          </label>
        </div>
      </form>
      <div class="modal-actions">
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-danger"
          :aria-disabled="awaitingResponse" @click="del">
          {{ $t('action.delete') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

defineOptions({
  name: 'EntityDelete'
});
const props = defineProps({
  state: Boolean,
  checkbox: Boolean,
  entity: Object,
  awaitingResponse: Boolean
});
const emit = defineEmits(['hide', 'delete']);

const noConfirm = ref(false);
watch(() => props.state, (state) => { if (!state) noConfirm.value = false; });

const input = ref(null);
const focusCheckbox = () => { if (props.checkbox) input.value.focus(); };

const del = () => {
  if (props.checkbox)
    emit('delete', [props.entity, !noConfirm.value]);
  else
    emit('delete', [props.entity]);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Delete {label}",
    "introduction": [
      // {label} is the label of an Entity.
      "Are you sure you want to delete “{label}”?"
    ],
    "field": {
      "noConfirm": "Delete immediately without confirmation until I leave the page"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "Löschen {label}",
    "introduction": [
      "Sind Sie sicher, dass Sie “{label}” löschen wollen?"
    ],
    "field": {
      "noConfirm": "Sofortiges Löschen ohne Bestätigung, bis ich die Seite verlasse"
    }
  },
  "es": {
    "title": "Borrar {label}",
    "introduction": [
      "¿Estás seguro de que quieres borrar “{label}”?"
    ],
    "field": {
      "noConfirm": "Borrar inmediatamente sin confirmación hasta que salga de la página"
    }
  },
  "fr": {
    "title": "Supprimer {label}",
    "introduction": [
      "Êtes vous sûr de vouloir supprimer \"{label}\" ?"
    ],
    "field": {
      "noConfirm": "Supprimer immédiatement sans confirmation jusqu'à ce que je quitte la page"
    }
  },
  "it": {
    "title": "Elimina {label}",
    "introduction": [
      "Sei sicuro di voler eliminare \"{label}\"?"
    ],
    "field": {
      "noConfirm": "Elimina immediatamente senza conferma finché non lascio la pagina"
    }
  },
  "pt": {
    "title": "Excluir {label}",
    "introduction": [
      "Tem certeza de que deseja excluir “{label}”?"
    ],
    "field": {
      "noConfirm": "Excluir imediatamente sem confirmação até que eu saia da página"
    }
  },
  "zh-Hant": {
    "title": "刪除{label}",
    "introduction": [
      "您確定要刪除「{label}」？"
    ],
    "field": {
      "noConfirm": "立即刪除，無需確認，直到我離開頁面"
    }
  }
}
</i18n>
