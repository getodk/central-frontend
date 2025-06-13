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
            :disabled="deleted" :disabled-message="deleted ? $t('filterDisabledMessage') : null"/>
        </form>
        <!-- TODO: merge these two forms -->
        <form v-if="!draft" class="form-inline field-dropdown-form" @submit.prevent>
          <submission-field-dropdown
          v-if="selectedFields != null && fields.selectable.length > 11"
          v-model="selectedFields"/>
        </form>
        <button id="submission-list-refresh-button" type="button"
          class="btn btn-outlined move-right" :aria-disabled="refreshing"
          @click="fetchChunk(false, true)">
          <span class="icon-refresh"></span>{{ $t('action.refresh') }}
          <spinner :state="refreshing"/>
        </button>
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
      <submission-table v-show="odata.dataExists"
        ref="table" :project-id="projectId" :xml-form-id="xmlFormId"
        :draft="draft" :fields="selectedFields"
        :deleted="deleted" :awaiting-deleted-responses="awaitingResponses"
        @review="reviewModal.show({ submission: $event })"
        @delete="showDelete"
        @restore="showRestore"/>
      <p v-show="emptyTableMessage" class="empty-table-message">
        {{ emptyTableMessage }}
      </p>
      <odata-loading-message type="submission"
        :top="pagination.size"
        :odata="odata"
        :filter="!!odataFilter"
        :refreshing="refreshing"
        :total-count="formVersion.dataExists ? formVersion.submissions : 0"/>

        <!-- @update:page is emitted on size change as well -->
        <pagination v-if="pagination.count > 0"
              v-model:page="pagination.page" v-model:size="pagination.size"
              :count="pagination.count" :size-options="pageSizeOptions"
              :spinner="odata.awaitingResponse"
              @update:page="handlePageChange()"/>
    </div>

    <submission-download v-bind="downloadModal" :form-version="formVersion"
      @hide="downloadModal.hide()"/>
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
import { DateTime } from 'luxon';
import { shallowRef, watch, reactive } from 'vue';

import EnketoFill from '../enketo/fill.vue';
import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import SubmissionDownload from './download.vue';
import SubmissionDownloadButton from './download-button.vue';
import SubmissionFieldDropdown from './field-dropdown.vue';
import SubmissionFilters from './filters.vue';
import SubmissionTable from './table.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';
import SubmissionDelete from './delete.vue';
import SubmissionRestore from './restore.vue';
import Pagination from '../pagination.vue';
import TeleportIfExists from '../teleport-if-exists.vue';

import useFields from '../../request-data/fields';
import useQueryRef from '../../composables/query-ref';
import useReviewState from '../../composables/review-state';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { arrayQuery } from '../../util/router';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { odataLiteral } from '../../util/odata';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionList',
  components: {
    EnketoFill,
    Loading,
    OdataLoadingMessage,
    Pagination,
    Spinner,
    SubmissionDelete,
    SubmissionDownload,
    SubmissionDownloadButton,
    SubmissionFieldDropdown,
    SubmissionFilters,
    SubmissionRestore,
    SubmissionTable,
    SubmissionUpdateReviewState,
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
    deleted: {
      type: Boolean,
      required: false
    }
  },
  emits: ['fetch-keys', 'fetch-deleted-count', 'toggle-qr'],
  setup(props) {
    const { form, keys, resourceView, odata, submitters, deletedSubmissionCount } = useRequestData();
    const formVersion = props.draft
      ? resourceView('formDraft', (data) => data.get())
      : form;
    const fields = useFields();

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
    const submissionDateRange = useQueryRef({
      fromQuery: (query) => {
        if (typeof query.start === 'string' && typeof query.end === 'string') {
          const start = DateTime.fromISO(query.start);
          const end = DateTime.fromISO(query.end);
          if (start.isValid && end.isValid && start <= end)
            return [start.startOf('day'), end.startOf('day')];
        }
        return [];
      },
      toQuery: (value) => (value.length !== 0
        ? { start: value[0].toISODate(), end: value[1].toISODate() }
        : { start: null, end: null })
    });
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
    const { request } = useRequest();

    const pageSizeOptions = [250, 500, 1000];

    return {
      form, keys, fields, formVersion, odata, submitters, deletedSubmissionCount,
      submitterIds, submissionDateRange, reviewStates, allReviewStates,
      request, pageSizeOptions
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

      awaitingResponses: new Set(),

      pagination: { page: 0, size: this.pageSizeOptions[0], count: 0 },
      now: new Date().toISOString(),
      snapshotFilter: ''
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
    odataSelect() {
      if (this.selectedFields == null) return null;
      const paths = this.selectedFields.map(({ path }) => path.replace('/', ''));
      paths.unshift('__id', '__system');
      return paths.join(',');
    },
    emptyTableMessage() {
      if (!this.odata.dataExists) return '';
      if (this.odata.value.length > 0) return '';

      if (this.odata.removedSubmissions.size === this.odata.count && this.odata.count > 0) {
        return this.deleted ? this.$t('deletedSubmission.allRestored') : this.$t('allDeleted');
      }
      if (this.odata.removedSubmissions.size > 0 && this.odata.value.length === 0) {
        return this.deleted ? this.$t('deletedSubmission.allRestoredOnPage') : this.$t('allDeletedOnPage');
      }
      return this.deleted ? this.$t('deletedSubmission.emptyTable')
        : (this.odataFilter ? this.$t('noMatching') : this.$t('submission.emptyTable'));
    }
  },
  watch: {
    odataFilter() {
      this.fetchChunk(true);
    },
    selectedFields(_, oldFields) {
      if (oldFields != null) this.fetchChunk(true);
    },
    deleted() {
      this.fetchChunk(true);
    },
    'odata.count': {
      handler() {
        if (this.formVersion.dataExists && this.odata.dataExists && !this.odataFilter)
          this.formVersion.submissions = this.odata.count;
      }
    },
    'odata.removedSubmissions.size': {
      handler(size) {
        if (this.formVersion.dataExists && this.odata.dataExists) {
          this.formVersion.submissions += this.deleted ? size : -size;
        }
      }
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    // `clear` indicates whether this.odata should be cleared before sending the
    // request. `refresh` indicates whether the request is a background refresh.
    fetchChunk(clear, refresh = false) {
      this.refreshing = refresh;
      // Are we fetching the first chunk of submissions or the next chunk?
      const first = clear || refresh;

      if (first) {
        this.now = new Date().toISOString();
        this.setSnapshotFilter();
        this.pagination.page = 0;
      }

      let $filter = this.snapshotFilter;
      if (this.odataFilter) {
        $filter += ` and ${this.odataFilter}`;
      }

      this.odata.request({
        url: apiPaths.odataSubmissions(
          this.projectId,
          this.xmlFormId,
          this.draft,
          {
            $top: this.pagination.size,
            $skip: this.pagination.page * this.pagination.size,
            $count: true,
            $wkt: true,
            $filter,
            $select: this.odataSelect,
            $orderby: '__system/submissionDate desc'
          }
        ),
        clear,
        patch: !first
          ? (response) => this.odata.replaceData(response.data, response.config)
          : null
      })
        .then(() => {
          this.pagination.count = this.odata.count;

          if (this.deleted) {
            this.deletedSubmissionCount.cancelRequest();
            if (!this.deletedSubmissionCount.dataExists) {
              this.deletedSubmissionCount.data = reactive({});
            }
            this.deletedSubmissionCount.value = this.odata.count;
          }
        })
        .finally(() => { this.refreshing = false; })
        .catch(noop);

      // emit event to parent component to re-fetch deleted Submissions count
      if (refresh && !this.deleted && !this.draft) {
        this.$emit('fetch-deleted-count');
      }

      // emit event to parent component to re-fetch keys if needed
      if (refresh && this.formVersion.keyId != null && this.keys.length === 0)
        this.$emit('fetch-keys');
    },
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
      this.fetchChunk(true);
      if (!this.draft) {
        this.submitters.request({
          url: apiPaths.submitters(this.projectId, this.xmlFormId, this.draft)
        }).catch(noop);
      }
    },
    setSnapshotFilter() {
      this.snapshotFilter = '';
      if (this.deleted) {
        // This is not foolproof. Missing clause: __system/deletedAt became null after `now`.
        // We don't keep restore date, that would have helped here.
        this.snapshotFilter += `__system/deletedAt le ${this.now}`;
      } else {
        this.snapshotFilter += `__system/submissionDate le ${this.now} and `;
        this.snapshotFilter += `(__system/deletedAt eq null or __system/deletedAt gt ${this.now})`;
      }
    },
    // This method accounts for the unlikely case that the user clicked the
    // refresh button before reviewing the submission. In that case, the
    // submission may have been edited or may no longer be shown.
    afterReview(originalSubmission, reviewState) {
      this.reviewModal.hide();
      this.alert.success(this.$t('alert.updateReviewState'));
      const index = this.odata.value.findIndex(submission =>
        submission.__id === originalSubmission.__id);
      if (index !== -1) {
        this.odata.value[index].__system.reviewState = reviewState;
        this.$refs.table.afterReview(index);
      }
    },
    showDelete(submission) {
      if (this.confirmDelete) {
        this.deleteModal.show({ submission });
      } else {
        this.requestDelete([submission, this.confirmDelete]);
      }
    },
    showRestore(submission) {
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
        url: apiPaths.submission(this.projectId, this.xmlFormId, instanceId)
      })
        .then(() => {
          this.deleteModal.hide();
          if (this.deletedSubmissionCount.dataExists) this.deletedSubmissionCount.value += 1;

          this.alert.success(this.$t('alert.submissionDeleted'));
          if (confirm != null) this.confirmDelete = confirm;

          this.odata.removedSubmissions.add(instanceId);
          /* Before doing a couple more things, we first determine whether
          this.odata.value still includes the Submission and if so, what the
          current index of the Submission is. If a request to refresh
          this.odata was sent while the deletion request was in
          progress, then there could be a race condition such that data doesn't
          exist for this.odata, or this.odata.value no longer
          includes the Submission. Another possible result of the race condition is
          that this.odata.value still includes the Submission, but the
          Submission's index has changed. */
          const index = this.odata.dataExists
            ? this.odata.value.findIndex(submission => submission.__id === instanceId)
            : -1;
          if (index !== -1) {
            this.$refs.table.afterDelete(index);
            this.odata.value.splice(index, 1);
          }
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
        url: apiPaths.restoreSubmission(this.projectId, this.xmlFormId, instanceId)
      })
        .then(() => {
          this.restoreModal.hide();
          if (this.deletedSubmissionCount.dataExists && this.deletedSubmissionCount.value > 0) {
            this.deletedSubmissionCount.value -= 1;
          }

          this.alert.success(this.$t('alert.submissionRestored'));
          if (confirm != null) this.confirmRestore = confirm;

          this.odata.removedSubmissions.add(instanceId);

          // See the comments in requestDelete().
          const index = this.odata.dataExists
            ? this.odata.value.findIndex(submission => submission.__id === instanceId)
            : -1;
          if (index !== -1) {
            this.$refs.table.afterDelete(index);
            this.odata.value.splice(index, 1);
          }
        })
        .catch(noop)
        .finally(() => {
          this.awaitingResponses.delete(instanceId);
        });
    },
    handlePageChange() {
      // This function is called for size change as well. So the total number of submissions are
      // less than the lowest size option, hence we don't need to make a request.
      if (this.odata.count < this.pageSizeOptions[0]) return;
      this.fetchChunk(false);
    },
    showDownloadModal(filtered = false) {
      if (filtered) {
        this.downloadModal.odataFilter = this.odataFilter;
      }
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
      // Further increase the space between the dropdown and the refresh button.
      margin-right: 10px;
    }
  }

  ~ #submission-download-button { margin-left: 0; }
}

#submission-list-refresh-button.move-right {
  margin-left: auto;
}

#submission-list table:has(tbody:empty) {
  display: none;
}

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
    "allDeleted": "All Submissions are deleted.",
    "allDeletedOnPage": "All Submissions on the page have been deleted.",
    "downloadDisabled": "Download is unavailable for deleted Submissions",
    "filterDisabledMessage": "Filtering is unavailable for deleted Submissions",
    "deletedSubmission": {
      "emptyTable": "There are no deleted Submissions.",
      "allRestored": "All deleted Submissions are restored.",
      "allRestoredOnPage": "All Submissions on the page have been restored."
    }
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
    "allDeleted": "Alle Übermittlungen werden gelöscht.",
    "allDeletedOnPage": "Alle Übermittlungen auf dieser Seite wurden gelöscht.",
    "downloadDisabled": "Der Download ist für gelöschte Übermittlungen nicht verfügbar",
    "filterDisabledMessage": "Filterung ist für gelöschte Übermittlungen nicht verfügbar",
    "deletedSubmission": {
      "emptyTable": "Es gibt keine gelöschten Übermittlungen.",
      "allRestored": "Alle gelöschten Übermittlungen werden wiederhergestellt.",
      "allRestoredOnPage": "Alle Übermittlungen auf dieser Seite wurden wiederhergestellt."
    }
  },
  "es": {
    "action": {
      "testOnDevice": "Prueba en el dispositivo",
      "testInBrowser": "Prueba en el navegador"
    },
    "noMatching": "No hay envíos coincidentes.",
    "allDeleted": "Todos los envíos se han eliminado.",
    "allDeletedOnPage": "Se han eliminado todos los envíos de la página.",
    "downloadDisabled": "La descarga no está disponible para los envíos eliminados",
    "filterDisabledMessage": "El Filtro no está disponible para los Envíos eliminados",
    "deletedSubmission": {
      "emptyTable": "No hay envíos eliminados.",
      "allRestored": "Se restablecen todos los envíos eliminados.",
      "allRestoredOnPage": "Se han restablecido todas las Envíos de la página."
    }
  },
  "fr": {
    "action": {
      "testOnDevice": "Tester sur un appareil",
      "testInBrowser": "Tester dans le naviguateur"
    },
    "noMatching": "Il n'y a pas de soumission correspondante.",
    "allDeleted": "Toutes les soumissions sont supprimées.",
    "allDeletedOnPage": "Toutes les soumissions de la page ont été supprimées.",
    "downloadDisabled": "Le téléchargement n'est pas possible pour les Soumissions supprimées.",
    "filterDisabledMessage": "Le filtrage n'est pas possible pour les Soumissions supprimées.",
    "deletedSubmission": {
      "emptyTable": "Il n'y a pas de Soumissions supprimées",
      "allRestored": "Toutes les Soumissions supprimées ont été restaurées.",
      "allRestoredOnPage": "Toutes les Soumissions de la page ont été restaurées."
    }
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
    "allDeleted": "Tutti gli invii vengono cancellati.",
    "allDeletedOnPage": "Tutti gli invii presenti nella pagina sono stati cancellati.",
    "downloadDisabled": "Il download non è disponibile per gli invii cancellati",
    "filterDisabledMessage": "Il filtro non è disponibile per gli invii cancellati.",
    "deletedSubmission": {
      "emptyTable": "Non ci sono invii cancellati.",
      "allRestored": "Tutti gli invii cancellati vengono ripristinati.",
      "allRestoredOnPage": "Tutti i contributi presenti nella pagina sono stati ripristinati."
    }
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
    "downloadDisabled": "O download está indisponível para Respostas excluídas",
    "filterDisabledMessage": "A filtragem está indisponível para Respostas excluídas",
    "deletedSubmission": {
      "emptyTable": "Não há Respostas excluídas"
    }
  },
  "sw": {
    "noMatching": "Hakuna Mawasilisho yanayolingana."
  },
  "zh-Hant": {
    "action": {
      "testOnDevice": "在設備上測試",
      "testInBrowser": "在瀏覽器中測試"
    },
    "noMatching": "沒有符合的提交內容。",
    "downloadDisabled": "已刪除的提交內容無法下載",
    "filterDisabledMessage": "無法對已刪除的提交內容進行過濾",
    "deletedSubmission": {
      "emptyTable": "沒有已刪除的提交內容。"
    }
  }
}
</i18n>
