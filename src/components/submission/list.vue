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
      <div id="submission-list-actions">
        <form class="form-inline" @submit.prevent>
          <submission-filters v-if="!draft" :submitter-id.sync="submitterId"
            :submission-date.sync="submissionDateRange"
            :review-state.sync="reviewStates"/>
          <submission-field-dropdown
            v-if="fields != null && selectableFields.length > 11"
            v-model="selectedFields"/>
          <button id="submission-list-refresh-button" type="button"
            class="btn btn-default" :disabled="refreshing"
            @click="fetchChunk(0, false)">
            <span class="icon-refresh"></span>{{ $t('action.refresh') }}
            <spinner :state="refreshing"/>
          </button>
        </form>
        <submission-download-button :form-version="formVersion"
          :filtered="odataFilter != null" @download="showModal('download')"/>
      </div>
      <submission-table v-show="submissions != null && submissions.length !== 0"
        ref="table" :project-id="projectId" :xml-form-id="xmlFormId"
        :draft="draft" :submissions="submissions" :fields="selectedFields"
        :original-count="originalCount" @review="showReview"/>
      <p v-show="submissions != null && submissions.length === 0"
        class="empty-table-message">
        {{ odataFilter == null ? $t('emptyTable') : $t('noMatching') }}
      </p>
      <div v-show="odataLoadingMessage != null" id="submission-list-message">
        <div id="submission-list-spinner-container">
          <spinner :state="odataLoadingMessage != null"/>
        </div>
        <div id="submission-list-message-text">{{ odataLoadingMessage }}</div>
      </div>
    </div>

    <submission-download :state="download.state" :form-version="formVersion"
      :odata-filter="odataFilter" @hide="hideModal('download')"/>
    <submission-update-review-state :state="review.state"
      :project-id="projectId" :xml-form-id="xmlFormId"
      :submission="review.submission" @hide="hideReview"
      @success="afterReview"/>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import { last } from 'ramda';
import { mapGetters } from 'vuex';

import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import SubmissionDownload from './decrypt.vue';
import SubmissionDownloadButton from './download-dropdown.vue';
import SubmissionFieldDropdown from './field-dropdown.vue';
import SubmissionFilters from './filters.vue';
import SubmissionTable from './table.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';

import modal from '../../mixins/modal';
import useReviewState from '../../composables/review-state';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { odataLiteral } from '../../util/odata';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionList',
  components: {
    Loading,
    Spinner,
    SubmissionDownload,
    SubmissionDownloadButton,
    SubmissionFieldDropdown,
    SubmissionFilters,
    SubmissionTable,
    SubmissionUpdateReviewState
  },
  mixins: [modal()],
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    draft: Boolean,
    // Returns the value of the $top query parameter.
    top: {
      type: Function,
      default: (skip) => (skip < 1000 ? 250 : 1000)
    }
  },
  setup() {
    const { reviewStates: allReviewStates } = useReviewState();
    return { allReviewStates };
  },
  data() {
    return {
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
      download: {
        state: false
      },
      review: {
        state: false,
        submission: null
      }
    };
  },
  computed: {
    ...requestData([
      'form',
      { key: 'formDraft', getOption: true },
      'keys',
      'fields',
      'odataChunk',
      'submitters'
    ]),
    ...mapGetters(['selectableFields']),
    submitterId: {
      get() {
        const { submitterId } = this.$route.query;
        return typeof submitterId === 'string' && /^[1-9]\d*$/.test(submitterId)
          ? submitterId
          : '';
      },
      set(submitterId) {
        this.replaceFilters({ submitterId });
      }
    },
    submissionDateRange: {
      get() {
        const { query } = this.$route;
        if (typeof query.start === 'string' && typeof query.end === 'string') {
          const start = DateTime.fromISO(query.start);
          const end = DateTime.fromISO(query.end);
          if (start.isValid && end.isValid && start <= end)
            return [start.startOf('day'), end.startOf('day')];
        }
        return [];
      },
      set(submissionDateRange) {
        return this.replaceFilters({ submissionDateRange });
      }
    },
    reviewStates: {
      get() {
        const { query } = this.$route;
        const values = Array.isArray(query.reviewState)
          ? query.reviewState.filter(reviewState => typeof reviewState === 'string')
          : (typeof query.reviewState === 'string' ? [query.reviewState] : []);
        return values
          .filter(value => this.allReviewStates.some(reviewState =>
            value === odataLiteral(reviewState)))
          .splice(0, 1);
      },
      set(reviewStates) {
        this.replaceFilters({ reviewStates });
      }
    },
    odataFilter() {
      if (this.draft) return null;
      const conditions = [];
      if (this.submitterId !== '')
        conditions.push(`__system/submitterId eq ${this.submitterId}`);
      if (this.submissionDateRange.length !== 0) {
        const start = this.submissionDateRange[0].toISO();
        const end = this.submissionDateRange[1].endOf('day').toISO();
        conditions.push(`__system/submissionDate ge ${start}`);
        conditions.push(`__system/submissionDate le ${end}`);
      }
      if (this.reviewStates.length !== 0) {
        const condition = this.reviewStates
          .map(reviewState => `__system/reviewState eq ${reviewState}`)
          .join(' or ');
        conditions.push(`(${condition})`);
      }
      return conditions.length !== 0 ? conditions.join(' and ') : null;
    },
    loadingOData() {
      return this.$store.getters.loading('odataChunk');
    },
    formVersion() {
      return this.draft ? this.formDraft : this.form;
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
    odataFilter() {
      this.fetchChunk(0, true);
    },
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
    document.addEventListener('scroll', this.afterScroll);
  },
  beforeDestroy() {
    document.removeEventListener('scroll', this.afterScroll);
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
      const query = { $top: top, $skip: skip, $count: true, $wkt: true };
      if (this.odataFilter != null) query.$filter = this.odataFilter;
      return this.$store.dispatch('get', [{
        key: 'odataChunk',
        url: apiPaths.odataSubmissions(
          this.projectId,
          this.xmlFormId,
          this.draft,
          query
        ),
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
        url: apiPaths.fields(this.projectId, this.xmlFormId, this.draft, {
          odata: true
        }),
        success: () => {
          // We also use 11 in the SubmissionFieldDropdown v-if.
          this.selectedFields = this.selectableFields.length <= 11
            ? this.selectableFields
            : this.selectableFields.slice(0, 10);
        }
      }]).catch(noop);
      this.fetchChunk(0, true);
      if (!this.draft) {
        this.$store.dispatch('get', [{
          key: 'submitters',
          url: apiPaths.submitters(this.projectId, this.xmlFormId, this.draft)
        }]).catch(noop);
      }
    },
    scrolledToBottom() {
      // Using pageYOffset rather than scrollY in order to support IE.
      return window.pageYOffset + window.innerHeight >=
        document.body.offsetHeight - 5;
    },
    // This method may need to change once we support submission deletion.
    afterScroll() {
      if (this.formVersion != null && this.keys != null &&
        this.fields != null && this.submissions != null &&
        this.submissions.length < this.originalCount && !this.loadingOData &&
        this.scrolledToBottom()) {
        this.fetchChunk(this.skip, false);
      }
    },
    replaceFilters({
      submitterId = this.submitterId,
      submissionDateRange = this.submissionDateRange,
      reviewStates = this.reviewStates
    }) {
      const query = {};
      if (submitterId !== '') query.submitterId = submitterId;
      if (submissionDateRange.length !== 0) {
        query.start = submissionDateRange[0].toISODate();
        query.end = submissionDateRange[1].toISODate();
      }
      query.reviewState = reviewStates;
      this.$router.replace({ path: this.$route.path, query });
    },
    showReview(submission) {
      this.review.submission = submission;
      this.showModal('review');
    },
    hideReview() {
      this.hideModal('review');
      this.review.submission = null;
    },
    // This method accounts for the unlikely case that the user clicked the
    // refresh button before reviewing the submission. In that case, the
    // submission may have been edited or may no longer be shown.
    afterReview(originalSubmission, reviewState) {
      this.hideReview();
      this.alert.success(this.$t('alert.updateReviewState'));
      const index = this.submissions.findIndex(submission =>
        submission.__id === originalSubmission.__id);
      if (index !== -1) {
        const submission = this.submissions[index];
        this.$set(this.submissions, index, {
          ...submission,
          __system: { ...submission.__system, reviewState }
        });
        this.$refs.table.afterReview(index);
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-list {
  // Make sure that there is enough space for the DateRangePicker when it is
  // open.
  min-height: 375px;
}

#submission-list-actions {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap-reverse;

  form > :first-child { margin-left: 0; }
}
#submission-field-dropdown {
  margin-left: 15px;
  margin-right: 5px;
}
#submission-list-refresh-button {
  margin-left: 10px;
  margin-right: 5px;
}
#submission-download-button {
  // The bottom margin is for if the download button wraps above the other
  // actions.
  margin-bottom: 10px;
  margin-left: auto;
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
    "loading": {
      "withoutCount": "Načítání příspěvků…",
      "all": "Načítání {count} příspěvku ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ...",
      "first": "Načítání prvního {top} z {count} příspěvku… | Načítání prvního {top} ze {count} příspěvků… | Načítání prvního {top} z {count} příspěvků… | Načítání prvního {top} z {count} příspěvků…",
      "middle": "Načítání {top} z dalšího {count} zbývajícího příspěvku… | Načítání {top} z dalších {count} zbývajících příspěvků… | Načítání {top} z dalších {count} zbývajících příspěvků… | Načítání {top} z dalších {count} zbývajících příspěvků…",
      "last": {
        "multiple": "Načítání posledního {count} příspěvku… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků…",
        "one": "Načítání posledního příspěvku…"
      },
      "filtered": {
        "withoutCount": "Načítání odpovídajících příspěvků…",
        "middle": "Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků…",
        "last": {
          "multiple": "Načítání posledního {count} odpovídajícího příspěvku… | Načítání posledních {count} odpovídajících příspěvků… | Načítání posledních {count} odpovídajících příspěvků… | Načítání posledních {count} odpovídajících příspěvků…",
          "one": "Načítání posledního odpovídajícího příspěvku…"
        }
      }
    },
    "emptyTable": "Zatím neexistují žádné příspěvky.",
    "noMatching": "Neexistují žádné odpovídající příspěvky."
  },
  "de": {
    "loading": {
      "withoutCount": "Übermittlungen laden...",
      "all": "{count} Übermittlung laden... | {count} Übermittlungen laden...",
      "first": "Lade die ersten {top} von {count} Übermittlung... | Lade die ersten {top} von {count} Übermittlungen...",
      "middle": "Lade weitere {top} von {count} übrigen Übermittlung... | Lade weitere {top} von {count} übrigen Übermittlungen...",
      "last": {
        "multiple": "Die letzte {count} Übermittlung laden... | Die letzten {count} Übermittlungen laden...",
        "one": "Letzte Übermittlung laden..."
      },
      "filtered": {
        "withoutCount": "Lade passende Übermittlungen...",
        "middle": "Lade weitere {top} von {count} übrigen passenden Übermittlung... | Lade weitere {top} von {count} übrigen passenden Übermittlungen...",
        "last": {
          "multiple": "Lade die letzte {count} passenden Übermittlung... | Lade die letzten {count} passenden Übermittlungen...",
          "one": "Lade die letzten passenden Übermittlungen..."
        }
      }
    },
    "emptyTable": "Es gibt noch keine Übermittlungen.",
    "noMatching": "Es gibt keine passenden Übermittlungen."
  },
  "es": {
    "loading": {
      "withoutCount": "Cargando los envíos...",
      "all": "Cargando {count} envío... | Cargando {count} envíos...",
      "first": "Cargando la primera {top} de {count} envios... | Cargando la primera {top} de {count} envios...",
      "middle": "Cargando {top} más de {count} envíos restantes... | Cargando {top} más de {count} envíos restantes...",
      "last": {
        "multiple": "Cargando el último {count} envío... | Cargando los últimos {count} envíos...",
        "one": "Cargando el último envío..."
      },
      "filtered": {
        "withoutCount": "Cargando envíos coincidentes…",
        "middle": "Cargando {top} más de {count} envíos restantes coincidentes... | Cargando {top} más de {count} envíos restantes coincidentes...",
        "last": {
          "multiple": "Cargando los últimos {count} envíos coincidentes… | Cargando los últimos {count} envíos coincidentes…",
          "one": "Cargando el último envío coincidente…"
        }
      }
    },
    "emptyTable": "No hay envíos todavía.",
    "noMatching": "No hay envíos coincidentes."
  },
  "fr": {
    "loading": {
      "withoutCount": "Chargement des soumissions...",
      "all": "Chargement de {count} soumission... | Chargement de {count} soumissions...",
      "first": "Chargement des premières {top} sur {count} soumissions... | Chargement des premières {top} sur {count} soumissions...",
      "middle": "Chargement de {top} autres de {count} soumission restante... | Chargement de {top} autres des {count} soumissions restantes...",
      "last": {
        "multiple": "Chargement de la {count} dernière soumissions... | Chargement des {count} dernières soumissions...",
        "one": "Chargement la dernière soumission..."
      },
      "filtered": {
        "withoutCount": "Chargement des soumissions correspondantes...",
        "middle": "Chargement de {top} autres des {count} soumissions correspondantes restantes... | Chargement de {top} autres des {count} soumissions correspondantes restantes...",
        "last": {
          "multiple": "Chargement d'{count} dernière soumission correspondante... | Chargement des {count} dernières soumissions correspondantes...",
          "one": "Chargement de la dernière soumission correspondante..."
        }
      }
    },
    "emptyTable": "Il n'y a pas encore de soumissions.",
    "noMatching": "Il n'y a pas de soumission correspondante."
  },
  "id": {
    "loading": {
      "withoutCount": "Memuat kiriman data...",
      "all": "Memuat {count} kiriman data...",
      "first": "Memuat yang pertama {top} dari {count} Pengiriman…",
      "middle": "Memuat {top} dari {count} sisa Pengiriman…",
      "last": {
        "multiple": "Memuat {count} kiriman data terakhir...",
        "one": "Memuat kiriman data terakhir..."
      },
      "filtered": {
        "withoutCount": "Memuat Pengiriman yang cocok...",
        "middle": "Memuat {top} dari {count} sisa Pengiriman yang cocok…",
        "last": {
          "multiple": "Memuat sisa {count} Pengiriman yang cocok…",
          "one": "Memuat Pengiriman terakhir yang cocok"
        }
      }
    },
    "emptyTable": "Belum ada kiriman data.",
    "noMatching": "Tidak ada Pengiriman yang cocok."
  },
  "it": {
    "loading": {
      "withoutCount": "Caricando invii...",
      "all": "Cricando {count} invio... | Cricando {count} invii...",
      "first": "Loading the first {top} of {count} Submission… | Caricando il primo {top} di {count} Invio…",
      "middle": "Caricamento di {top} in più di {count} invio rimanente... | Caricamento di {top} in più di {count} invii rimanenti...",
      "last": {
        "multiple": "Caricando l'ultimo {count} invio… | Caricando gli ultimi {count} invii…",
        "one": "Caricamento dell'ultimo invio in corso..."
      },
      "filtered": {
        "withoutCount": "Cricando invii corrispondenti...",
        "middle": "Caricamento di {top} in più di {count} invio corrispondente rimanente... | Caricamento di {top} in più di {count} invii corrispondenti rimanenti...",
        "last": {
          "multiple": "Caricando l'ultimo {count} invio corrispondente… | Caricando gli ultimi {count} invii corrispondenti…",
          "one": "Cricando gli ultimi invii corrispondenti..."
        }
      }
    },
    "emptyTable": "Non ci sono ancora invii.",
    "noMatching": "Non sono presenti invii corrispondenti."
  },
  "ja": {
    "loading": {
      "withoutCount": "提出済フォームの読み込み中...",
      "all": "{count}の提出済フォームを読み込み中...",
      "first": "{count}件の提出済フォームの内、最初の{top}を読み込み中...",
      "middle": "残り{count}件の提出済フォームの内、さらに{top}件を読み込み中...",
      "last": {
        "multiple": "最後の{count}件の提出済フォームを読み込み中...",
        "one": "最後の提出済フォームを読み込み中..."
      },
      "filtered": {
        "withoutCount": "照合できる提出済フォームの読み込み中...",
        "middle": "一致する残り{count}件の提出済フォームの内、さらに{top}件を読み込み中...",
        "last": {
          "multiple": "一致する最後の{count}件の提出済フォームを読み込み中...",
          "one": "最後の照合できる提出済フォームを読み込み中..."
        }
      }
    },
    "emptyTable": "表示できる提出済フォームはありません。",
    "noMatching": "照合できる提出済フォームはありません。"
  },
  "sw": {
    "loading": {
      "withoutCount": "Inapakia Mawasilisho...",
      "all": "Inapakia Mawasilisho {count}... | Inapakia Mawasilisho {count}...",
      "first": "Inapakia {top} ya kwanza kati ya Mawasilisho {count}... | Inapakia {top} ya kwanza kati ya Mawasilisho {count}...",
      "middle": "Inapakia {top} zaidi ya Mawasilisho {count} yaliyosalia... | Inapakia {top} zaidi ya Mawasilisho {count} yaliyosalia...",
      "last": {
        "multiple": "Inapakia Mawasilisho {count} ya mwisho... | Inapakia Mawasilisho {count} ya mwisho...",
        "one": "Inapakia Wasilisho la mwisho..."
      },
      "filtered": {
        "withoutCount": "Inapakia Mawasilisho yanayolingana...",
        "middle": "Inapakia {top} zaidi ya Mawasilisho {count} yanayolingana... | Inapakia {top} zaidi ya Mawasilisho {count} yanayolingana...",
        "last": {
          "multiple": "Inapakia Mawasilisho {count} ya mwisho yanayolingana... | Inapakia Mawasilisho {count} ya mwisho yanayolingana...",
          "one": "Inapakia Wasilisho linalolingana la mwisho..."
        }
      }
    },
    "emptyTable": "Bado hakuna Mawasilisho.",
    "noMatching": "Hakuna Mawasilisho yanayolingana."
  }
}
</i18n>
