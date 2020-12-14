<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="submission-list">
    <loading :state="$store.getters.initiallyLoading(['fields'])"/>
    <div v-show="fields != null">
      <form class="form-inline" @submit.prevent>
        <submission-filters v-if="filterable" v-bind.sync="filters"/>
        <submission-field-dropdown
          v-if="fields != null && selectableFields.length > 11"
          v-model="selectedFields"/>
        <button id="submission-list-refresh-button" type="button"
          class="btn btn-primary" :disabled="refreshing"
          @click="fetchChunk(0, false)">
          <span class="icon-refresh"></span>{{ $t('action.refresh') }}
          <spinner :state="refreshing"/>
        </button>
        <submission-download-dropdown v-if="formVersion != null"
          :base-url="baseUrl" :form-version="formVersion"
          :odata-filter="odataFilter" @decrypt="showDecrypt"/>
      </form>
      <template v-if="submissions != null">
        <p v-if="submissions.length === 0" class="empty-table-message">
          {{ odataFilter == null ? $t('emptyTable') : $t('noMatching') }}
        </p>
        <submission-table v-else-if="fields != null" :base-url="baseUrl"
          :submissions="submissions" :fields="selectedFields"
          :original-count="originalCount" :shows-submitter="showsSubmitter"/>
      </template>
      <div v-show="odataLoadingMessage != null" id="submission-list-message">
        <div id="submission-list-spinner-container">
          <spinner :state="odataLoadingMessage != null"/>
        </div>
        <div id="submission-list-message-text">{{ odataLoadingMessage }}</div>
      </div>
    </div>
    <submission-decrypt v-bind="decrypt" @hide="hideModal('decrypt')"/>
  </div>
</template>

<script>
import { last } from 'ramda';
import { mapGetters } from 'vuex';

import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import SubmissionDecrypt from './decrypt.vue';
import SubmissionDownloadDropdown from './download-dropdown.vue';
import SubmissionFieldDropdown from './field-dropdown.vue';
import SubmissionFilters from './filters.vue';
import SubmissionTable from './table.vue';

import Form from '../../presenters/form';
import modal from '../../mixins/modal';
import { noop } from '../../util/util';
import { queryString } from '../../util/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionList',
  components: {
    Loading,
    Spinner,
    SubmissionDecrypt,
    SubmissionDownloadDropdown,
    SubmissionFieldDropdown,
    SubmissionFilters,
    SubmissionTable
  },
  mixins: [modal()],
  props: {
    baseUrl: {
      type: String,
      required: true
    },
    formVersion: Form, // eslint-disable-line vue/require-default-prop
    filterable: {
      type: Boolean,
      default: false
    },
    showsSubmitter: {
      type: Boolean,
      default: false
    },
    // Returns the value of the $top query parameter.
    top: {
      type: Function,
      default: (skip) => (skip < 1000 ? 250 : 1000)
    },
    // Function that returns true if the user has scrolled to the bottom of the
    // page (or close to it) and false if not. Implementing this as a prop in
    // order to facilitate testing.
    scrolledToBottom: {
      type: Function,
      default: () =>
        // Using pageYOffset rather than scrollY in order to support IE.
        window.pageYOffset + window.innerHeight >= document.body.offsetHeight - 5
    }
  },
  data() {
    return {
      filters: {
        submitterId: '',
        submissionDate: []
      },
      selectedFields: null,
      refreshing: false,
      submissions: null,
      instanceIds: new Set(),
      // The count of submissions at the time of the initial fetch or last
      // refresh
      originalCount: null,
      // The number of submissions that have been skipped so far. This should
      // equal submissions.length unless a submission has been created since the
      // initial fetch or last refresh.
      skip: 0,
      decrypt: {
        state: false,
        formAction: null
      }
    };
  },
  computed: {
    ...requestData(['keys', 'fields', 'odataChunk', 'submitters']),
    ...mapGetters(['selectableFields']),
    odataFilter() {
      const conditions = [];
      if (this.filters.submitterId !== '')
        conditions.push(`__system/submitterId eq ${this.filters.submitterId}`);
      if (this.filters.submissionDate.length !== 0) {
        const start = this.filters.submissionDate[0].toISO();
        const end = this.filters.submissionDate[1].endOf('day').toISO();
        conditions.push(`__system/submissionDate ge ${start}`);
        conditions.push(`__system/submissionDate le ${end}`);
      }
      return conditions.length !== 0 ? conditions.join(' and ') : null;
    },
    loadingOData() {
      return this.$store.getters.loading('odataChunk');
    },
    odataLoadingMessage() {
      if (!this.loadingOData || this.refreshing) return null;
      if (this.submissions == null) {
        if (this.odataFilter != null)
          return this.$t('loading.filtered.withoutCount');
        if (this.formVersion == null || this.formVersion.submissions === 0)
          return this.$t('loading.withoutCount');
        const top = this.top(this.skip);
        if (this.formVersion.submissions <= top)
          return this.$tcn('loading.all', this.formVersion.submissions);
        return this.$tcn('loading.first', this.formVersion.submissions, {
          top: this.$n(top, 'default')
        });
      }

      const pathPrefix = this.odataFilter == null
        ? 'loading'
        : 'loading.filtered';
      const remaining = this.originalCount - this.submissions.length;
      const top = this.top(this.skip);
      if (remaining > top) {
        return this.$tcn(`${pathPrefix}.middle`, remaining, {
          top: this.$n(top, 'default')
        });
      }
      return remaining > 1
        ? this.$tcn(`${pathPrefix}.last.multiple`, remaining)
        : this.$t(`${pathPrefix}.last.one`);
    }
  },
  watch: {
    'filters.submitterId': 'filter',
    'filters.submissionDate': 'filter',
    selectedFields(_, oldFields) {
      if (oldFields != null) this.fetchChunk(0, true);
    },
    loadingOData(loading) {
      if (!loading) this.refreshing = false;
    }
  },
  created() {
    this.fetchData();
  },
  mounted() {
    document.addEventListener('scroll', this.onScroll);
  },
  beforeDestroy() {
    document.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    clearSubmissions() {
      if (this.odataChunk != null)
        this.$store.commit('clearData', 'odataChunk');
      this.submissions = null;
      this.instanceIds.clear();
      this.originalCount = null;
      this.skip = 0;
    },
    replaceSubmissions() {
      this.submissions = this.odataChunk.value;
      this.instanceIds.clear();
      for (const submission of this.submissions)
        this.instanceIds.add(submission.__id);
      this.originalCount = this.odataChunk['@odata.count'];
    },
    pushSubmissions() {
      const lastSubmissionDate = last(this.submissions).__system.submissionDate;
      for (const submission of this.odataChunk.value) {
        // If one or more submissions have been created since the initial fetch
        // or last refresh, then the latest chunk of submissions may include a
        // newly created submission or a submission that is already shown in the
        // table.
        if (submission.__system.submissionDate <= lastSubmissionDate &&
          !this.instanceIds.has(submission.__id)) {
          this.submissions.push(submission);
          this.instanceIds.add(submission.__id);
        }
      }
    },
    fetchChunk(skip, clear) {
      if (clear) this.clearSubmissions();
      this.refreshing = !clear && skip === 0;
      const top = this.top(skip);
      const query = { $top: top, $skip: skip, $count: true };
      if (this.odataFilter != null) query.$filter = this.odataFilter;
      return this.$store.dispatch('get', [{
        key: 'odataChunk',
        url: `${this.baseUrl}.svc/Submissions${queryString(query)}`,
        // We use this.odataChunk['@odata.count'] to access the filtered count,
        // so we don't clear this.odataChunk here. this.clearSubmissions() will
        // clear this.odataChunk.
        clear: false,
        success: () => {
          if (skip === 0)
            this.replaceSubmissions();
          else
            this.pushSubmissions();
          this.skip = top + skip;
        }
      }]).catch(noop);
    },
    fetchData() {
      this.$store.dispatch('get', [{
        key: 'fields',
        url: `${this.baseUrl}/fields?odata=true`,
        success: () => {
          // We also use 11 in the SubmissionFieldDropdown v-if.
          this.selectedFields = this.selectableFields.length <= 11
            ? this.selectableFields
            : this.selectableFields.slice(0, 10);
        }
      }]).catch(noop);
      this.fetchChunk(0, true);
      if (this.filterable) {
        this.$store.dispatch('get', [{
          key: 'submitters',
          url: `${this.baseUrl}/submissions/submitters`
        }]).catch(noop);
      }
    },
    // This method may need to change once we support submission deletion.
    onScroll() {
      if (this.formVersion != null && this.keys != null &&
        this.fields != null && this.submissions != null &&
        this.submissions.length < this.originalCount && !this.loadingOData &&
        this.scrolledToBottom()) {
        this.fetchChunk(this.skip, false);
      }
    },
    filter() {
      this.fetchChunk(0, true);
    },
    showDecrypt(formAction) {
      this.decrypt.formAction = formAction;
      this.showModal('decrypt');
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-list {
  // Make sure there is enough space for the DateRangePicker and the
  // SubmissionDownloadDropdown when they are open.
  min-height: 375px;
}

#submission-filters + #submission-field-dropdown { margin-left: 15px }
#submission-filters + #submission-list-refresh-button { margin-left: 10px; }
#submission-field-dropdown + #submission-list-refresh-button {
  margin-left: 15px;
}
#submission-download-dropdown {
  float: right;
  top: 3px;
}

#submission-list-message {
  margin-left: 28px;
  padding-bottom: 38px;
  position: relative;

  #submission-list-spinner-container {
    margin-right: 8px;
    position: absolute;
    top: 8px;
    width: 16px; // eventually probably better not to default spinner to center.
  }

  #submission-list-message-text {
    color: #555;
    font-size: 12px;
    padding-left: 24px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "loading": {
      // This text is shown when the number of Submissions loading is unknown.
      "withoutCount": "Loading Submissions…",
      "all": "Loading {count} Submission… | Loading {count} Submissions…",
      // {top} is a number that is either 250 or 1000. {count} may be any number
      // that is at least 250. The string will be pluralized based on {count}.
      "first": "Loading the first {top} of {count} Submission… | Loading the first {top} of {count} Submissions…",
      // {top} is a number that is either 250 or 1000. {count} may be any number
      // that is at least 250. The string will be pluralized based on {count}.
      "middle": "Loading {top} more of {count} remaining Submission… | Loading {top} more of {count} remaining Submissions…",
      "last": {
        "multiple": "Loading the last {count} Submission… | Loading the last {count} Submissions…",
        "one": "Loading the last Submission…"
      },
      "filtered": {
        // This text is shown when the number of Submissions loading is unknown.
        "withoutCount": "Loading matching Submissions…",
        // {top} is a number that is either 250 or 1000. {count} may be any
        // number that is at least 250. The string will be pluralized based on
        // {count}.
        "middle": "Loading {top} more of {count} remaining matching Submission… | Loading {top} more of {count} remaining matching Submissions…",
        "last": {
          "multiple": "Loading the last {count} matching Submission… | Loading the last {count} matching Submissions…",
          "one": "Loading the last matching Submission…"
        }
      }
    },
    "emptyTable": "There are no Submissions yet.",
    "noMatching": "There are no matching Submissions."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "download": {
        "withCount": "Stáhnout {count} záznam | Stáhnout tyto {count} záznamy | Stáhnout všech {count} záznamů | Stáhnout všech {count} záznamů",
        "withoutCount": "Stáhnout všechny záznamy"
      },
      "analyze": "Analyzovat přes OData"
    },
    "analyzeDisabled": "Přístup k datům OData není k dispozici kvůli šifrování formulářů",
    "loading": {
      "withoutCount": "Načítání příspěvků…",
      "all": "Načítání {count} příspěvku ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ...",
      "first": "Načítání prvních {top} ze {count} příspěvků…",
      "middle": "Načítání {top} dalších ze {count} zbývajících příspěvků…",
      "last": {
        "multiple": "Načítání posledního {count} příspěvku… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků…",
        "one": "Načítání posledního příspěvku…"
      }
    },
    "emptyTable": "Zatím neexistují žádné příspěvky.",
    "remaining": "{count} řádka zbývá | {count} řádky zbývají. | {count} řádek zbývá. | {count} řádek zbývá."
  },
  "de": {
    "action": {
      "download": {
        "withCount": "{count} Datensatz herunterladen | Alle {count} Datensätze herunterladen",
        "withoutCount": "Alle Datensätze herunterladen"
      },
      "analyze": "Mittels OData analysieren"
    },
    "analyzeDisabled": "OData-Zugriff ist wegen Formularverschlüsselung nicht verfügbar.",
    "loading": {
      "withoutCount": "Übermittlungen laden...",
      "all": "{count} Übermittlung laden... | {count} Übermittlungen laden...",
      "first": "Die ersten {top} von {count} Übermittlungen laden...",
      "middle": "{top} weitere von {count} verbliebenen Übermittlungen laden...",
      "last": {
        "multiple": "Die letzte {count} Übermittlung laden... | Die letzten {count} Übermittlungen laden...",
        "one": "Letzte Übermittlung laden..."
      }
    },
    "emptyTable": "Es gibt noch keine Übermittlungen.",
    "remaining": "{count} Zeile verbleibend. | {count} Zeilen verbleibend."
  },
  "es": {
    "action": {
      "download": {
        "withCount": "Descargar {count} registro | Descargar todos los {count} registros",
        "withoutCount": "Descargar todos los registros"
      },
      "analyze": "Analizar vía OData"
    },
    "analyzeDisabled": "El acceso a OData no está disponible debido al cifrado del formulario",
    "loading": {
      "withoutCount": "Cargando los envíos...",
      "all": "Cargando {count} envío... | Cargando {count} envíos...",
      "first": "Cargando los primeros {top} de {count} envíos...",
      "middle": "Cargando {top} más de {count} envíos restantes...",
      "last": {
        "multiple": "Cargando el último {count} envío... | Cargando los últimos {count} envíos...",
        "one": "Cargando el último envío..."
      }
    },
    "emptyTable": "No hay envíos todavía.",
    "remaining": "{count} archivo permanece. | {count} archivos permanecen."
  },
  "fr": {
    "action": {
      "download": {
        "withCount": "Télécharger le {count} enregistrement | Télécharger tous les {count} enregistrements",
        "withoutCount": "Télécharger tous les enregistrements"
      },
      "analyze": "Analyser via OData"
    },
    "analyzeDisabled": "L'accès à OData n'est pas disponible en raison du chiffrement du formulaire",
    "loading": {
      "withoutCount": "Chargement des soumissions...",
      "all": "Chargement de {count} soumission... | Chargement de {count} soumissions...",
      "first": "Chargement des premières {top} sur {count} soumissions...",
      "middle": "Chargement de {top} autres des {count} soumissions restantes...",
      "last": {
        "multiple": "Chargement de la {count} dernière soumissions... | Chargement des {count} dernières soumissions...",
        "one": "Chargement la dernière soumission..."
      }
    },
    "emptyTable": "Il n'y a pas encore de soumissions.",
    "remaining": "{count} ligne restante. | {count} lignes restantes."
  },
  "id": {
    "action": {
      "download": {
        "withCount": "Unduh semua {count} catatan.",
        "withoutCount": "Unduh semua catatan"
      },
      "analyze": "Analisis lewat OData"
    },
    "analyzeDisabled": "Akses OData tidak tersedia karena enkripsi formulir",
    "loading": {
      "withoutCount": "Memuat kiriman data...",
      "all": "Memuat {count} kiriman data...",
      "first": "Memuat {top} pertama dari {count} kiriman data...",
      "middle": "Memuat {top} lebih dari {count} sisa kiriman data...",
      "last": {
        "multiple": "Memuat {count} kiriman data terakhir...",
        "one": "Memuat kiriman data terakhir..."
      }
    },
    "emptyTable": "Belum ada kiriman data.",
    "remaining": "{count} baris tersisa."
  }
}
</i18n>
