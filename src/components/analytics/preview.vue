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
  <modal id="analytics-preview" :state="state" hideable backdrop large @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <loading :state="$store.getters.initiallyLoading(['analyticsPreview'])"/>
      <template v-if="analyticsPreview">
        <analytics-metrics-table :title="$t('common.system')" :metrics="systemSummary"/>
        <div id="analytics-preview-project-summary">
          <span class="header">{{ $t('projects.title') }}</span>
          <span class="explanation">{{ $t('projects.subtitle', { numProjects }) }}</span>
        </div>
        <div id="analytics-preview-project-tables">
          <div id="users-forms-column">
            <analytics-metrics-table :title="$t('resource.users')" :metrics="userSummary"/>
            <analytics-metrics-table :title="$t('resource.forms')" :metrics="formSummary"/>
          </div>
          <div id="submissions-column">
            <analytics-metrics-table :title="$t('resource.submissions')"
              :metrics="submissionSummary"/>
            <analytics-metrics-table :title="$t('submissionStates')"
              :metrics="submissionStateSummary"/>
          </div>
        </div>
      </template>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import { omit, pick } from 'ramda';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import AnalyticsMetricsTable from './metrics-table.vue';

import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

// Metrics to filter out (with pick/omit) and put in
// a separate table
const submissionStateMetrics = [
  'num_submissions_received',
  'num_submissions_approved',
  'num_submissions_has_issues',
  'num_submissions_rejected',
  'num_submissions_edited'
];

export default {
  name: 'AnalyticsPreview',
  components: { AnalyticsMetricsTable, Loading, Modal },
  props: {
    state: Boolean
  },
  computed: {
    ...requestData(['analyticsPreview']),
    systemSummary() {
      return this.analyticsPreview.system;
    },
    firstProject() {
      // eslint-disable-next-line arrow-body-style
      return this.analyticsPreview.projects.reduce((a, b) => {
        return (a.submissions.num_submissions_received.recent > b.submissions.num_submissions_received.recent) ? a : b;
      });
    },
    userSummary() {
      return this.firstProject.users;
    },
    formSummary() {
      return this.firstProject.forms;
    },
    submissionSummary() {
      // The submission metrics come from the API together but will be split.
      // This summary is for submission metrics NOT about state.
      return omit(submissionStateMetrics, this.firstProject.submissions);
    },
    submissionStateSummary() {
      // The submission metrics come from the API together but will be split.
      // This summary is for submission state metrics (approved, rejected, etc.)
      return pick(submissionStateMetrics, this.firstProject.submissions);
    },
    numProjects() {
      return this.$n(this.analyticsPreview.projects.length);
    }
  },
  watch: {
    state(state) {
      if (state) this.fetchData();
    }
  },
  methods: {
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'analyticsPreview',
        url: '/v1/analytics/preview'
      }]).catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#analytics-preview {
  .modal-introduction > p {
    max-width: 100%;
  }
}

#analytics-preview-project-summary {
  padding-bottom: 5px;

  .header {
    font-weight: 500;
    padding-right: 10px;
  }
}

#analytics-preview-project-tables {
  display: flex;
  flex-wrap: wrap;

  #users-forms-column {
    padding-right: 10px;
    flex-grow: 1;
  }

  #submissions-column {
    flex-grow: 1;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Anonymized Usage Report",
    "introduction": [
      "Thank you for thinking about sending some usage information. This data will help us prioritize your needs!",
      "Shown here is the report we are collecting currently. To respond to new features and needs, we will sometimes change what is reported, but we will only ever gather summary averages like you see here.",
      "You can always come here to see what is being collected."
    ],
    "projects": {
      // This is the title shown above a series of metrics about Project usage.
      "title": "Project Summaries",
      "subtitle": "(Showing the most active Project of {numProjects} Projects)"
    },
    // This is the title of a single table in the analytics metrics report
    // of metrics about submission state (approved, rejected, etc)
    "submissionStates": "Submission States"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "es": {
    "title": "Informe de uso anonimizado",
    "introduction": [
      "Gracias por pensar en enviar información de uso. Estos datos nos ayudarán a priorizar sus necesidades.",
      "Aquí se muestra el informe que estamos recopilando actualmente. Para responder a las nuevas funciones y necesidades, a veces cambiaremos lo que se informa, pero solo recopilaremos promedios resumidos como se ve aquí.",
      "Siempre puedes venir aquí para ver qué se está recolectando."
    ],
    "projects": {
      "title": "Resúmenes de proyectos",
      "subtitle": "Mostrando 1 Proyecto de {numProjects}"
    }
  },
  "it": {
    "title": "Report di utilizzo anonimo",
    "introduction": [
      "Grazie per aver pensato di inviare alcune informazioni sull'utilizzo. Questi dati ci aiuteranno a dare la priorità alle tue esigenze!",
      "Qui è mostrato il rapporto che stiamo raccogliendo attualmente. Per rispondere a nuove funzionalità ed esigenze, a volte modificheremo ciò che viene segnalato, ma raccoglieremo solo medie riepilogative come vedi qui.",
      "Puoi sempre venire qui per vedere cosa viene raccolto."
    ],
    "projects": {
      "title": "Riepiloghi del progetto",
      "subtitle": "Mostrando 1 progetto di {numProjects}"
    }
  }
}
</i18n>
