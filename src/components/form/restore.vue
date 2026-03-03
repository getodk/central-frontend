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
  <modal id="form-restore" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div v-if="warnings != null" class="modal-warnings">
        <p>{{ $t('warningsText[0]') }}</p>
        <ul>
          <template v-for="dataset of warnings.datasets" :key="dataset.name">
            <li>
              {{ $t('warningsText[1].dataset', { name: dataset.name }) }}
              <span v-show="dataset.isNew">
                <span class="icon-plus-circle dataset-new" v-tooltip.sr-only></span>
                <span class="sr-only">&nbsp;{{ $t('new') }}</span>
              </span>
              <br>
              <!-- This is important; i18n-list's PostEffect watcher + awaitResponse + warning
               changing together causes infinite update recursion -->
              <span v-if="!awaitingResponse">
                {{ $t('warningsText[1].properties', dataset.properties) }}
                <i18n-list v-slot="{ value: property }" :list="dataset.properties"
                  class="property-list">
                  <span>{{ property.name }}</span>
                  <span v-show="property.isNew">
                    <span class="icon-plus-circle property-new" v-tooltip.sr-only></span>
                    <span class="sr-only">&nbsp;{{ $t('new') }}</span>
                  </span>
                </i18n-list>
              </span>
            </li>
          </template>
        </ul>
        <p>{{ $t('warningsText[2]') }}</p>
        <p>
          <button type="button" class="btn btn-danger"
            :aria-disabled="awaitingResponse" @click="doRestore(true)">
            {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
          </button>
        </p>
      </div>
      <div v-if="form" class="modal-introduction">
        <i18n-t tag="p" keypath="introduction[0]">
          <template #name>
            <strong>{{ form.nameOrId }}</strong>
          </template>
        </i18n-t>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.noCancel') }}
        </button>
        <button type="button" class="btn btn-danger"
          :aria-disabled="awaitingResponse" @click="doRestore(false)">
          {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import I18nList from '../i18n/list.vue';


import useRequest from '../../composables/request';
import { apiPaths, isProblem } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'FormRestore',
  components: { Modal, Spinner, I18nList },
  props: {
    state: Boolean,
    form: Object
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  data() {
    return {
      warnings: null
    };
  },
  methods: {
    doRestore(ignoreWarnings) {
      const query = ignoreWarnings ? { ignoreWarnings } : null;
      this.request({
        method: 'POST',
        url: apiPaths.restoreForm(this.form.projectId, this.form.id, query),
        fulfillProblem: ({ code }) => code === 400.44
      })
        .then(({ data }) => {
          if (isProblem(data)) {
            // eslint-disable-next-line prefer-destructuring
            this.warnings = data.details[0];
          } else {
            this.$emit('success');
            this.warnings = null;
          }
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
.modal-warnings {
  .dataset-new, .property-new {
    margin-left: 2px;
    color: #08a10b;
    vertical-align: super;
  }
}
</style>
<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Restore Form",
    "introduction": [
      "Are you sure you want to restore the Form {name}?",
      "The Form will be restored to its previous state, including all data, settings, and permissions.",
      "If the Form is deleted again, it will be another 30 days before it is removed."
    ],
    "warningsText": [
      "Restoring this Form will also create:",
      {
        "dataset": "Dataset: {name}",
        "properties": "Property: | Properties:"
      },
      "Do you still want to restore this Form?"
    ]
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "Formular wiederherstellen",
    "introduction": [
      "Sind Sie sicher dass Sie das Formular {name} wiederherstellen möchten?",
      "Das Formular wird in seinem vorherigen Zustand wiederhergestellt, einschließlich aller Daten, Einstellungen und Berechtigungen.",
      "Wenn das Formular erneut gelöscht wird, dauert es 30 Tage bis es entfernt wird."
    ]
  },
  "es": {
    "title": "Restablecer formulario",
    "introduction": [
      "¿Está seguro de que desea restablecer el formulario {name}?",
      "El formulario se restaurará a su estado anterior, incluidos todos los datos, configuraciones y permisos.",
      "Si el formulario se elimina nuevamente, pasarán otros 30 días antes de que se elimine."
    ]
  },
  "fr": {
    "title": "Restaurer le Formulaire",
    "introduction": [
      "Êtes vous certain(e) de vouloir restaurer le Formulaire {name} ?",
      "Le formulaire sera restauré dans son état précédent, incluant toutes les données, paramètres et permissions.",
      "Si le formulaire est à nouveau supprimé, il faudra attendre à nouveau 30 jours avant qu'il ne soit retiré."
    ]
  },
  "it": {
    "title": "Ripristina Formulario",
    "introduction": [
      "Sei sicuro di voler ripristinare il formulario {name} ?",
      "Il Formulario verrà ripristinato allo stato precedente, inclusi tutti i dati, le impostazioni e le autorizzazioni.",
      "Se il Formulario viene nuovamente eliminato, ci vorranno altri 30 giorni prima che venga rimosso."
    ]
  },
  "pt": {
    "title": "Recuperar Formulário"
  },
  "zh": {
    "title": "恢复表单",
    "introduction": [
      "确定要恢复表单{name}吗？",
      "表单将恢复至先前状态，包括所有数据、设置和权限。",
      "若该表单再次被删除，将再过30天才会被移除。"
    ]
  },
  "zh-Hant": {
    "title": "還原表格",
    "introduction": [
      "您確定要還原表格{name}吗？",
      "表單將恢復到先前的狀態，包括所有資料、設定和權限。",
      "如果再次刪除該表格，則需要再過 30 天才會被刪除。"
    ]
  }
}
</i18n>
