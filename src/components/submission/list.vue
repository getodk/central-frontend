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
    <loading :state="fields.initiallyLoading"/>
    <div v-show="selectedFields != null">
      <div id="submission-list-actions" class="table-actions-bar">
        <template v-if="draft">
          <button id="submission-list-test-on-device" type="button"
            class="btn btn-outlined" @click="$emit('toggle-qr', $event.target)">
            <span class="icon-qrcode"></span>{{ $t('action.testOnDevice') }}
          </button>
          <enketo-fill v-if="formVersion.dataExists"
            id="submission-list-test-in-browser" :form-version="formVersion">
            <span class="icon-desktop"></span>{{ $t('action.testInBrowser') }}
          </enketo-fill>
        </template>
        <form v-if="!draft" class="form-inline" @submit.prevent>
          <submission-filters v-model:submitterId="submitterIds"
            v-model:submissionDate="submissionDateRange"
            v-model:reviewState="reviewStates"
            :disabled="deleted" :disabled-message="deleted ? $t('filterDisabledMessage') : null"
            @reset-click="resetFilters"/>
        </form>
        <!-- TODO: merge these two forms -->
        <form v-if="!draft" class="form-inline field-dropdown-form" @submit.prevent>
          <submission-field-dropdown
            v-if="selectedFields != null && fields.selectable.length > 11"
            v-model="selectedFields"/>
        </form>

        <radio-field v-if="!draft && fields.dataExists && fields.hasMappable"
          v-model="dataView" :options="viewOptions" :disabled="encrypted || deleted"
          :button-appearance="true" :disabled-message="deleted ? $t('noMapDeleted') : $t('noMapEncryption')"/>
        <teleport-if-exists v-if="formVersion.dataExists && odata.dataExists"
          :to="'.form-submissions-heading-row'">
          <submission-download-button :form-version="formVersion"
            :aria-disabled="deleted"
            :filtered="odataFilter != null && !deleted"
            v-tooltip.aria-describedby="deleted ? $t('downloadDisabled') : null"
            @download="showDownloadModal"
            @download-filtered="showDownloadModal(true)"/>
        </teleport-if-exists>
      </div>

      <table-refresh-bar :refreshing="refreshing" :odata="odata" @refresh-click="refresh"/>

      <p v-show="emptyMessage" class="empty-table-message">
        {{ emptyMessage }}
        <template v-if="emptyMessage === emptyMapMessage">
          <br>
          <doc-link to="central-submissions/#accessing-submissions">{{ $t('learnMoreMap') }}</doc-link>
        </template>
      </p>

      <submission-table-view v-if="dataView === 'table'" ref="view"
        :project-id="projectId" :xml-form-id="xmlFormId" :draft="draft" :deleted="deleted"
        :filter="odataFilter" :fields="selectedFields"
        :total-count="formVersion.submissions"
        :awaiting-responses="awaitingResponses"
        @review="showReview" @delete="showDelete" @restore="showRestore"/>
      <submission-map-view v-else ref="view"
        :project-id="projectId" :xml-form-id="xmlFormId"
        :filter="geojsonFilter"
        :awaiting-responses="awaitingResponses"
        @review="showReview" @delete="showDelete"/>
    </div>

    <submission-download v-bind="downloadModal" :form-version="formVersion"
      @hide="downloadModal.hide(false)"/>
    <submission-update-review-state v-bind="reviewModal" :project-id="projectId"
      :xml-form-id="xmlFormId" @hide="reviewModal.hide()"
      @success="afterReview"/>
    <submission-delete v-bind="deleteModal" checkbox
      :awaiting-response="deleteModal.state && awaitingResponses.has(deleteModal.submission.__id)"
      @hide="deleteModal.hide()" @delete="requestDelete"/>
    <submission-restore v-bind="restoreModal" checkbox
      :awaiting-response="restoreModal.state && awaitingResponses.has(restoreModal.submission.__id)"
      @hide="restoreModal.hide()" @restore="requestRestore"/>
  </div>
</template>

<script>
import { shallowRef, watch } from 'vue';

import DocLink from '../doc-link.vue';
import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import RadioField from '../radio-field.vue';
import SubmissionDelete from './delete.vue';
import SubmissionDownload from './download.vue';
import SubmissionDownloadButton from './download-button.vue';
import SubmissionFieldDropdown from './field-dropdown.vue';
import SubmissionFilters from './filters.vue';
import SubmissionMapView from './map-view.vue';
import SubmissionRestore from './restore.vue';
import SubmissionTableView from './table-view.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';
import TeleportIfExists from '../teleport-if-exists.vue';

import useDataView from '../../composables/data-view';
import useFields from '../../request-data/fields';
import useQueryRef from '../../composables/query-ref';
import useDateRangeQueryRef from '../../composables/date-range-query-ref';
import useReviewState from '../../composables/review-state';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { arrayQuery } from '../../util/router';
import { joinSentences } from '../../util/i18n';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { odataLiteral } from '../../util/odata';
import { useRequestData } from '../../request-data';
import TableRefreshBar from '../table-refresh-bar.vue';

export default {
  name: 'SubmissionList',
  components: {
    DocLink,
    EnketoFill,
    Loading,
    RadioField,
    SubmissionDelete,
    SubmissionDownload,
    SubmissionDownloadButton,
    SubmissionFieldDropdown,
    SubmissionFilters,
    SubmissionMapView,
    SubmissionRestore,
    SubmissionTableView,
    SubmissionUpdateReviewState,
    TableRefreshBar,
    TeleportIfExists
  },
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
    deleted: Boolean,
    encrypted: Boolean
  },
  emits: ['fetch-keys', 'fetch-deleted-count', 'toggle-qr'],
  setup(props) {
    const { form, keys, resourceView, odata, submitters, deletedSubmissionCount } = useRequestData();
    const formVersion = props.draft
      ? resourceView('formDraft', (data) => data.get())
      : form;
    const fields = useFields();

    // Filter query parameters
    const submitterIds = useQueryRef({
      fromQuery: (query) => {
        const stringIds = arrayQuery(query.submitterId, {
          validator: (value) => /^[1-9]\d*$/.test(value)
        });
        return stringIds.length !== 0
          ? stringIds.map(id => Number.parseInt(id, 10))
          : (submitters.dataExists ? [...submitters.ids] : []);
      },
      toQuery: (value) => ({
        submitterId: value.length === submitters.length
          ? []
          : value.map(id => id.toString())
      })
    });
    watch(() => submitters.dataExists, () => {
      if (submitterIds.value.length === 0 && submitters.length !== 0)
        submitterIds.value = [...submitters.ids];
    });
    const submissionDateRange = useDateRangeQueryRef();
    const { reviewStates: allReviewStates } = useReviewState();
    const reviewStates = useQueryRef({
      fromQuery: (query) => arrayQuery(query.reviewState, {
        validator: (value) => allReviewStates.some(reviewState =>
          value === odataLiteral(reviewState)),
        default: () => allReviewStates.map(odataLiteral)
      }),
      toQuery: (value) => ({
        reviewState: value.length === allReviewStates.length ? [] : value
      })
    });

    const { dataView, options: viewOptions } = useDataView();

    const { request } = useRequest();

    return {
      form, keys, fields, formVersion, odata, submitters, deletedSubmissionCount,
      submitterIds, submissionDateRange, reviewStates, allReviewStates,
      dataView, viewOptions,
      request
    };
  },
  data() {
    return {
      // selectedFields will be an array of fields. It needs to be shallow so
      // that the elements of the array are not reactive proxies. That's
      // important for SubmissionFieldDropdown, which will do exact equality
      // checks. (The selected fields that it passes to the Multiselect must be
      // among the options.)
      selectedFields: shallowRef(null),
      refreshing: false,
      // Modals
      downloadModal: modalData(),
      reviewModal: modalData(),
      deleteModal: modalData(),
      restoreModal: modalData(),

      // state that indicates whether we need to show delete confirmation dialog
      confirmDelete: true,
      // state that indicates whether we need to show restore confirmation dialog
      confirmRestore: true,

      awaitingResponses: new Set()
    };
  },
  computed: {
    filtersOnSubmitterId() {
      if (this.submitterIds.length === 0) return false;
      const selectedAll = this.submitters.dataExists &&
        this.submitterIds.length === this.submitters.length &&
        this.submitterIds.every(id => this.submitters.ids.has(id));
      return !selectedAll;
    },
    odataFilter() {
      if (this.draft) return null;

      const conditions = [];
      if (this.filtersOnSubmitterId) {
        const condition = this.submitterIds
          .map(id => `__system/submitterId eq ${id}`)
          .join(' or ');
        conditions.push(`(${condition})`);
      }
      if (this.submissionDateRange.length !== 0) {
        const start = this.submissionDateRange[0].toISO();
        const end = this.submissionDateRange[1].endOf('day').toISO();
        conditions.push(`__system/submissionDate ge ${start}`);
        conditions.push(`__system/submissionDate le ${end}`);
      }
      if (this.reviewStates.length !== this.allReviewStates.length) {
        const condition = this.reviewStates
          .map(reviewState => `__system/reviewState eq ${reviewState}`)
          .join(' or ');
        conditions.push(`(${condition})`);
      }
      return conditions.length !== 0 ? conditions.join(' and ') : null;
    },
    geojsonFilter() {
      if (this.draft) return null;
      const query = {};
      if (this.filtersOnSubmitterId) query.submitterId = this.submitterIds;
      if (this.submissionDateRange.length !== 0) {
        query.start__gte = this.submissionDateRange[0].toISO();
        query.end__lte = this.submissionDateRange[1].endOf('day').toISO();
      }
      if (this.reviewStates.length !== this.allReviewStates.length) {
        query.reviewState = this.reviewStates.map(reviewState =>
          // Undo odataLiteral(): remove quotes.
          (reviewState === 'null' ? reviewState : reviewState.slice(1, -1)));
      }
      return Object.keys(query).length !== 0 ? query : null;
    },
    emptyMapMessage() {
      return joinSentences(this.$i18n, [this.$t('common.emptyMap'), this.$t('emptyMap')]);
    },
    emptyMessage() {
      if (!this.odata.dataExists) return '';
      if (this.odata.value.length > 0) return '';

      // Cases related to submission deletion
      if (this.odata.removedSubmissions.size === this.odata.count && this.odata.count > 0) {
        return this.deleted ? this.$t('deletedSubmission.allRestored') : this.$t('allDeleted');
      }
      if (this.odata.removedSubmissions.size > 0 && this.odata.value.length === 0) {
        return this.deleted ? this.$t('deletedSubmission.allRestoredOnPage') : this.$t('allDeletedOnPage');
      }
      if (this.deleted) {
        return this.$t('deletedSubmission.emptyTable');
      }

      if (this.odataFilter) return this.$t('noMatching');
      return this.dataView === 'table'
        ? this.$t('submission.emptyTable')
        : this.emptyMapMessage;
    }
  },
  watch: {
    'odata.count': {
      handler() {
        // Update this.formVersion.submissions to match this.odata.count.
        // this.odata.count is more likely to be up-to-date, since it's
        // refreshed more frequently. We don't update this.formVersion if
        // this.odata is a subset of submissions. That includes when the map
        // view sets this.odata, as some submissions might not have geo data and
        // won't appear on the map.
        if (this.formVersion.dataExists && this.odata.dataExists &&
          this.dataView === 'table' && !this.odataFilter && !this.deleted)
          this.formVersion.submissions = this.odata.count;
      }
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.fields.request({
        url: apiPaths.fields(this.projectId, this.xmlFormId, this.draft, {
          odata: true
        })
      })
        .then(() => {
          // We also use 11 in the SubmissionFieldDropdown v-if.
          this.selectedFields = this.fields.selectable.length <= 11
            ? this.fields.selectable
            : this.fields.selectable.slice(0, 10);
        })
        .catch(noop);
      if (!this.draft) {
        this.submitters.request({
          url: apiPaths.submitters(this.projectId, this.xmlFormId, this.draft)
        }).catch(noop);
      }
    },
    refresh() {
      this.refreshing = true;
      this.$refs.view.refresh()
        .then(() => { this.refreshing = false; });

      // emit event to parent component to re-fetch deleted Submissions count
      if (!this.deleted && !this.draft) this.$emit('fetch-deleted-count');

      // emit event to parent component to re-fetch keys if needed
      if (this.formVersion.keyId != null && this.keys.length === 0)
        this.$emit('fetch-keys');
    },
    resetFilters() {
      this.$router.replace({ path: this.$route.path, query: {} });
    },
    cancelBackgroundRefresh() {
      if (!this.refreshing) return;
      this.$refs.view.cancelRefresh();
      this.deletedSubmissionCount.cancelRequest();
      this.keys.cancelRequest();
    },
    showReview(submission) {
      this.cancelBackgroundRefresh();
      this.reviewModal.show({ submission });
    },
    afterReview(reviewState) {
      const { submission } = this.reviewModal;
      submission.__system.reviewState = reviewState;
      this.reviewModal.hide();
      this.alert.success(this.$t('alert.updateReviewState'));
      this.$refs.view.afterReview(submission.__id);
    },
    showDelete(submission) {
      this.cancelBackgroundRefresh();
      if (this.confirmDelete) {
        this.deleteModal.show({ submission });
      } else {
        this.requestDelete([submission, this.confirmDelete]);
      }
    },
    showRestore(submission) {
      this.cancelBackgroundRefresh();
      if (this.confirmRestore) {
        this.restoreModal.show({ submission });
      } else {
        this.requestRestore([submission, this.confirmRestore]);
      }
    },
    requestDelete(event) {
      const [{ __id: instanceId }, confirm] = event;

      this.awaitingResponses.add(instanceId);

      this.request({
        method: 'DELETE',
        url: apiPaths.submission(this.projectId, this.xmlFormId, instanceId),
        fulfillProblem: ({ code }) => code === 404.1
      })
        .then(() => {
          this.deleteModal.hide();
          this.alert.success(this.$t('alert.submissionDeleted'));
          if (confirm != null) this.confirmDelete = confirm;

          this.odata.removedSubmissions.add(instanceId);
          this.formVersion.submissions -= 1;
          if (this.deletedSubmissionCount.dataExists) this.deletedSubmissionCount.value += 1;

          this.$refs.view.afterDelete(instanceId);
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(instanceId);
        });
    },
    requestRestore(event) {
      const [{ __id: instanceId }, confirm] = event;

      this.awaitingResponses.add(instanceId);

      this.request({
        method: 'POST',
        url: apiPaths.restoreSubmission(this.projectId, this.xmlFormId, instanceId),
        fulfillProblem: ({ code }) => code === 404.1
      })
        .then(() => {
          this.restoreModal.hide();
          this.alert.success(this.$t('alert.submissionRestored'));
          if (confirm != null) this.confirmRestore = confirm;

          this.odata.removedSubmissions.add(instanceId);
          this.formVersion.submissions += 1;
          if (this.deletedSubmissionCount.dataExists && this.deletedSubmissionCount.value > 0)
            this.deletedSubmissionCount.value -= 1;

          this.$refs.view.afterDelete(instanceId);
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(instanceId);
        });
    },
    showDownloadModal(filtered = false) {
      this.downloadModal.odataFilter = filtered ? this.odataFilter : null;
      this.downloadModal.show();
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-list {
  // Make sure that there is enough space for the DateRangePicker when it is
  // open.
  &:has(.date-range-picker) { min-height: 375px; }
}

#submission-list-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap-reverse;
  // This results in 10px of space between elements on the row, as well as 10px
  // between rows if elements start wrapping. The main example of that is that
  // the download button can wrap above the other actions if the viewport is not
  // wide enough.
  gap: 10px;
}

// Adjust the spacing between actions on the draft testing page.
#submission-list-test-in-browser {
  ~ .form-inline {
    // It is possible for .form-inline to be :empty, but we still render it so
    // that the buttons that follow it are shown on the righthand side of the
    // page.
    margin-left: auto;

    #submission-field-dropdown {
      // There are no filters, so no need for margin-left.
      margin-left: 0;
    }
  }

  ~ #submission-download-button { margin-left: 0; }
}

#submission-list .radio-field { margin-left: auto; }

#submission-table:has(tbody tr) + .empty-table-message {
  display: none;
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "testOnDevice": "Test on device",
      "testInBrowser": "Test in browser"
    },
    "noMatching": "There are no matching Submissions.",
    "emptyMap": "Submissions only appear if they include data in the first geo field.",
    "learnMoreMap": "Learn more about mapping Submissions",
    "allDeleted": "All Submissions are deleted.",
    "allDeletedOnPage": "All Submissions on the page have been deleted.",
    "downloadDisabled": "Download is unavailable for deleted Submissions",
    "filterDisabledMessage": "Filtering is unavailable for deleted Submissions",
    "noMapEncryption": "Map is unavailable due to Form encryption",
    "deletedSubmission": {
      "emptyTable": "There are no deleted Submissions.",
      "allRestored": "All deleted Submissions are restored.",
      "allRestoredOnPage": "All Submissions on the page have been restored."
    },
    "noMapDeleted": "Map is unavailable for deleted Submissions"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noMatching": "Neexistují žádné odpovídající příspěvky."
  },
  "de": {
    "action": {
      "testOnDevice": "Test am Gerät",
      "testInBrowser": "Test im Browser"
    },
    "noMatching": "Es gibt keine passenden Übermittlungen.",
    "emptyMap": "Übermittlungen werden nur angezeigt, wenn sie Daten im ersten Geofeld enthalten.",
    "learnMoreMap": "Erfahren Sie mehr über Mapping-Einreichungen",
    "allDeleted": "Alle Übermittlungen werden gelöscht.",
    "allDeletedOnPage": "Alle Übermittlungen auf dieser Seite wurden gelöscht.",
    "downloadDisabled": "Der Download ist für gelöschte Übermittlungen nicht verfügbar",
    "filterDisabledMessage": "Filterung ist für gelöschte Übermittlungen nicht verfügbar",
    "noMapEncryption": "Karte ist wegen Formularverschlüsselung nicht verfügbar.",
    "deletedSubmission": {
      "emptyTable": "Es gibt keine gelöschten Übermittlungen.",
      "allRestored": "Alle gelöschten Übermittlungen werden wiederhergestellt.",
      "allRestoredOnPage": "Alle Übermittlungen auf dieser Seite wurden wiederhergestellt."
    },
    "noMapDeleted": "Karte ist für gelöschte Übermittlungen nicht verfügbar"
  },
  "es": {
    "action": {
      "testOnDevice": "Prueba en el dispositivo",
      "testInBrowser": "Prueba en el navegador"
    },
    "noMatching": "No hay envíos coincidentes.",
    "emptyMap": "Los envíos solo aparecen si incluyen datos en el primer campo geo.",
    "learnMoreMap": "Más información sobre el mapeo de envíos",
    "allDeleted": "Todos los envíos se han eliminado.",
    "allDeletedOnPage": "Se han eliminado todos los envíos de la página.",
    "downloadDisabled": "La descarga no está disponible para los envíos eliminados",
    "filterDisabledMessage": "El Filtro no está disponible para los Envíos eliminados",
    "noMapEncryption": "Mapa no disponible debido al cifrado de Formulario",
    "deletedSubmission": {
      "emptyTable": "No hay envíos eliminados.",
      "allRestored": "Se restablecen todos los envíos eliminados.",
      "allRestoredOnPage": "Se han restablecido todas las Envíos de la página."
    },
    "noMapDeleted": "El mapa no está disponible para los envíos eliminados."
  },
  "fr": {
    "action": {
      "testOnDevice": "Tester sur un appareil",
      "testInBrowser": "Tester dans le naviguateur"
    },
    "noMatching": "Il n'y a pas de soumission correspondante.",
    "emptyMap": "Les soumissions apparaissent seulement si elles ont une valeur dans le premier champ de type géographique.",
    "learnMoreMap": "Apprenez plus à propos de la carte de soumissions",
    "allDeleted": "Toutes les soumissions sont supprimées.",
    "allDeletedOnPage": "Toutes les soumissions de la page ont été supprimées.",
    "downloadDisabled": "Le téléchargement n'est pas possible pour les Soumissions supprimées.",
    "filterDisabledMessage": "Le filtrage n'est pas possible pour les Soumissions supprimées.",
    "noMapEncryption": "La carte n'est pas disponible en raison du chiffrement du formulaire.",
    "deletedSubmission": {
      "emptyTable": "Il n'y a pas de Soumissions supprimées",
      "allRestored": "Toutes les Soumissions supprimées ont été restaurées.",
      "allRestoredOnPage": "Toutes les Soumissions de la page ont été restaurées."
    },
    "noMapDeleted": "La carte n'es pas disponible pour les soumissions supprimées."
  },
  "id": {
    "noMatching": "Tidak ada Pengiriman yang cocok."
  },
  "it": {
    "action": {
      "testOnDevice": "Testa sul dispositivo",
      "testInBrowser": "Testa nel browser"
    },
    "noMatching": "Non sono presenti invii corrispondenti.",
    "emptyMap": "Gli invii vengono visualizzati solo se includono dati nel primo campo geo.",
    "learnMoreMap": "Scopri di più sulla mappatura degli invii",
    "allDeleted": "Tutti gli invii vengono cancellati.",
    "allDeletedOnPage": "Tutti gli invii presenti nella pagina sono stati cancellati.",
    "downloadDisabled": "Il download non è disponibile per gli invii cancellati",
    "filterDisabledMessage": "Il filtro non è disponibile per gli invii cancellati.",
    "noMapEncryption": "Mappa non è disponibile a causa della crittografia del formulario",
    "deletedSubmission": {
      "emptyTable": "Non ci sono invii cancellati.",
      "allRestored": "Tutti gli invii cancellati vengono ripristinati.",
      "allRestoredOnPage": "Tutti i contributi presenti nella pagina sono stati ripristinati."
    },
    "noMapDeleted": "La Mappa non è disponibile per gli invii cancellati"
  },
  "ja": {
    "noMatching": "照合できる提出済フォームはありません。"
  },
  "pt": {
    "action": {
      "testOnDevice": "Testar no dispositivo'",
      "testInBrowser": "Testar no navegador"
    },
    "noMatching": "Não foram encontradas respostas com esses parâmetros.",
    "allDeleted": "Todas as Respostas foram excluídas.",
    "allDeletedOnPage": "Todas as Respostas nesta página foram excluídas.",
    "downloadDisabled": "O download está indisponível para Respostas excluídas",
    "filterDisabledMessage": "A filtragem está indisponível para Respostas excluídas",
    "noMapEncryption": "O mapa não está disponível por que o Formulário está encriptado",
    "deletedSubmission": {
      "emptyTable": "Não há Respostas excluídas",
      "allRestored": "Todas as Respostas excluídas foram recuperadas.",
      "allRestoredOnPage": "Todas as respostas na página foram recuperadas."
    },
    "noMapDeleted": "O Mapa está indisponível para Respostas excluídas"
  },
  "sw": {
    "noMatching": "Hakuna Mawasilisho yanayolingana."
  },
  "zh": {
    "action": {
      "testOnDevice": "在设备上测试",
      "testInBrowser": "在浏览器中测试"
    },
    "noMatching": "没有符合的提交内容",
    "emptyMap": "仅当提交数据包含首个地理字段的信息时，才会显示相应记录。",
    "learnMoreMap": "进一步了解提交地图数据功能",
    "allDeleted": "已删除所有提交内容。",
    "allDeletedOnPage": "当前页面中的所有提交数据已被删除。",
    "downloadDisabled": "导出选项",
    "filterDisabledMessage": "对于已删除的提交内容，筛选功能不可用。",
    "noMapEncryption": "地图功能因表单加密而不可用。",
    "deletedSubmission": {
      "emptyTable": "没有已删除的提交内容。",
      "allRestored": "所有已删除的提交内容都已恢复。",
      "allRestoredOnPage": "所有此页面上的提交内容都已还原。"
    },
    "noMapDeleted": "对于已删除的提交内容，地图功能不可用"
  },
  "zh-Hant": {
    "action": {
      "testOnDevice": "在設備上測試",
      "testInBrowser": "在瀏覽器中測試"
    },
    "noMatching": "沒有符合的提交內容。",
    "emptyMap": "只有當提交內容包含第一個地理欄位的資料時，才會顯示。",
    "allDeleted": "所有提交內容都會被刪除。",
    "allDeletedOnPage": "頁面上的所有提交內容都已刪除。",
    "downloadDisabled": "已刪除的提交內容無法下載",
    "filterDisabledMessage": "無法對已刪除的提交內容進行過濾",
    "noMapEncryption": "地圖因表單加密而無法使用",
    "deletedSubmission": {
      "emptyTable": "沒有已刪除的提交內容。",
      "allRestored": "所有已刪除的提交內容都會還原。",
      "allRestoredOnPage": "頁面上的所有提交內容都已還原。"
    },
    "noMapDeleted": "地圖無法用於已刪除的提交"
  }
}
</i18n>
