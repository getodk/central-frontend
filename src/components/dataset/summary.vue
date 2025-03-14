<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <summary-item v-if="datasetDiff.dataExists && datasetDiff.length > 0" icon="magic-wand">
    <template #heading>
      {{ datasetDiff.length }}
    </template>
    <template #body>
      <p>{{ $tc('datasetUpdates', datasetDiff.length) }}</p>
      <template v-for="(dataset, index) in datasetDiff" :key="dataset.name">
        <!-- TODO replace it with expandable-row -->
        <dataset-summary-row :dataset="dataset"/>
        <hr v-if="index < datasetDiff.length - 1">
      </template>
    </template>
  </summary-item>
</template>

<script>
import SummaryItem from '../summary-item.vue';
import { useRequestData } from '../../request-data';
import DatasetSummaryRow from './summary/row.vue';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'DatasetSummary',
  components: { SummaryItem, DatasetSummaryRow },
  inject: ['projectId', 'xmlFormId'],
  props: {
    isDraft: {
      type: Boolean,
      Default: false
    }
  },
  setup(props) {
    const { form, formDraftDatasetDiff, formDatasetDiff } = useRequestData();
    return { form, datasetDiff: props.isDraft ? formDraftDatasetDiff : formDatasetDiff };
  },
  created() {
    this.fetchDsDiff();
  },
  methods: {
    fetchDsDiff() {
      const url = this.isDraft ? apiPaths.formDraftDatasetDiff : apiPaths.formDatasetDiff;

      this.datasetDiff.request({
        url: url(this.projectId, this.xmlFormId),
        resend: false
      }).catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
  {
    "en": {
      // Number of Entity List(s) is shown separately above this text
      "datasetUpdates":"Entity List is updated by this Form: | Entity Lists are updated by this Form:"
    }
  }
  </i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "datasetUpdates": "Entitätsliste wird durch dieses Formular aktualisiert: | Entitätslisten werden durch dieses Formular aktualisiert:"
  },
  "es": {
    "datasetUpdates": "La lista de entidades se actualiza mediante este formulario: | Las listas de entidades se actualizan mediante este formulario: | Las listas de entidades se actualizan mediante este formulario:"
  },
  "fr": {
    "datasetUpdates": "Liste d'entités est mise à jour par ce formulaire: | Listes d'entités sont mises à jour par ce formulaire: | Listes d'entités sont mises à jour par ce formulaire:"
  },
  "it": {
    "datasetUpdates": "L' elenco delle entità è aggiornato da questo formulario: | Gli elenchi delle entità sono aggiornati da questo formulario: | Gli elenchi delle entità sono aggiornati da questo formulario:"
  },
  "pt": {
    "datasetUpdates": "Lista de Entidade é atualizada por este Formulário: | Listas de Entidades são atualizadas por este Formulário: | Listas de Entidades são atualizadas por este Formulário:"
  },
  "sw": {
    "datasetUpdates": "Orodha za Mashirika husasishwa na Fomu hii: | Orodha za Mashirika husasishwa na Fomu hii:"
  },
  "zh-Hant": {
    "datasetUpdates": "實體清單已透過此表格更新："
  }
}
</i18n>
