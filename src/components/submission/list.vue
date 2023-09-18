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
      <div id="submission-list-actions">
        <form class="form-inline" @submit.prevent>
          <submission-filters v-if="!draft" v-model:submitterId="submitterIds"
            v-model:submissionDate="submissionDateRange"
            v-model:reviewState="reviewStates"/>
          <submission-field-dropdown
            v-if="selectedFields != null && fields.selectable.length > 11"
            v-model="selectedFields"/>
          <button id="submission-list-refresh-button" type="button"
            class="btn btn-default" :aria-disabled="refreshing"
            @click="fetchChunk(true, true)">
            <span class="icon-refresh"></span>{{ $t('action.refresh') }}
            <spinner :state="refreshing"/>
          </button>
        </form>
        <submission-download-button :form-version="formVersion"
          :filtered="odataFilter != null" @download="showModal('download')"/>
      </div>
      <submission-table v-show="odata.dataExists && odata.value.length !== 0"
        ref="table" :project-id="projectId" :xml-form-id="xmlFormId"
        :draft="draft" :fields="selectedFields" @review="showReview"/>
      <p v-show="odata.dataExists && odata.value.length === 0"
        class="empty-table-message">
        {{ odataFilter == null ? $t('submission.emptyTable') : $t('noMatching') }}
      </p>
      <odata-loading-message type="submission"
        :top="top(odata.dataExists ? odata.value.length : 0)"
        :odata="odata"
        :filter="!!odataFilter"
        :refreshing="refreshing"
        :total-count="formVersion.dataExists ? formVersion.submissions : 0"/>
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
import { shallowRef, watchEffect } from 'vue';

import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import SubmissionDownload from './download.vue';
import SubmissionDownloadButton from './download-button.vue';
import SubmissionFieldDropdown from './field-dropdown.vue';
import SubmissionFilters from './filters.vue';
import SubmissionTable from './table.vue';
import SubmissionUpdateReviewState from './update-review-state.vue';

import modal from '../../mixins/modal';
import useFields from '../../request-data/fields';
import useReviewState from '../../composables/review-state';
import useSubmissions from '../../request-data/submissions';
import { apiPaths } from '../../util/request';
import { arrayQuery } from '../../util/router';
import { noop } from '../../util/util';
import { odataLiteral } from '../../util/odata';
import { useRequestData } from '../../request-data';

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
    SubmissionUpdateReviewState,
    OdataLoadingMessage
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
      default: (loaded) => (loaded < 1000 ? 250 : 1000)
    }
  },
  setup(props) {
    const { form, keys, resourceView } = useRequestData();
    const formVersion = props.draft
      ? resourceView('formDraft', (data) => data.get())
      : form;
    const fields = useFields();
    const { odata, submitters } = useSubmissions();
    // We do not reconcile `odata` with either form.lastSubmission or
    // project.lastSubmission.
    watchEffect(() => {
      if (formVersion.dataExists && odata.dataExists &&
        formVersion.submissions !== odata.count && !odata.filtered)
        formVersion.submissions = odata.count;
    });

    const { reviewStates: allReviewStates } = useReviewState();

    return {
      form, keys, fields, formVersion, odata, submitters,
      allReviewStates
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
    submitterIds: {
      get() {
        const stringIds = arrayQuery(this.$route.query.submitterId, {
          validator: (value) => /^[1-9]\d*$/.test(value)
        });
        return stringIds.length !== 0
          ? stringIds.map(id => Number.parseInt(id, 10))
          : (this.submitters.dataExists ? [...this.submitters.ids] : []);
      },
      set(submitterIds) {
        this.replaceFilters({ submitterIds });
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
        this.replaceFilters({ submissionDateRange });
      }
    },
    reviewStates: {
      get() {
        return arrayQuery(this.$route.query.reviewState, {
          validator: (value) => this.allReviewStates.some(reviewState =>
            value === odataLiteral(reviewState)),
          default: () => this.allReviewStates.map(odataLiteral)
        });
      },
      set(reviewStates) {
        this.replaceFilters({ reviewStates });
      }
    },
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
  },
  watch: {
    odataFilter() {
      this.fetchChunk(true);
    },
    selectedFields(_, oldFields) {
      if (oldFields != null) this.fetchChunk(true);
    }
  },
  created() {
    this.fetchData();
  },
  mounted() {
    document.addEventListener('scroll', this.afterScroll);
  },
  beforeUnmount() {
    document.removeEventListener('scroll', this.afterScroll);
  },
  methods: {
    fetchChunk(clear, refresh = false) {
      const loaded = this.odata.dataExists ? this.odata.value.length : 0;

      this.refreshing = refresh;

      this.odata.request({
        url: apiPaths.odataSubmissions(
          this.projectId,
          this.xmlFormId,
          this.draft,
          {
            $top: this.top(loaded),
            $count: true,
            $wkt: true,
            $filter: this.odataFilter,
            $select: this.odataSelect,
            $skiptoken: loaded > 0 && !clear ? new URL(this.odata.nextLink).searchParams.get('$skiptoken') : null
          }
        ),
        clear: clear && !refresh,
        patch: loaded > 0 && !clear && !refresh
          ? (response) => this.odata.addChunk(response.data)
          : null
      })
        .finally(() => { this.refreshing = false; })
        .catch(noop);
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
    scrolledToBottom() {
      // Using pageYOffset rather than scrollY in order to support IE.
      return window.pageYOffset + window.innerHeight >=
        document.body.offsetHeight - 5;
    },
    // This method may need to change once we support submission deletion.
    afterScroll() {
      if (this.formVersion.dataExists && this.keys.dataExists &&
        this.fields.dataExists && this.odata.dataExists &&
        this.odata.nextLink &&
        !this.odata.awaitingResponse && this.scrolledToBottom())
        this.fetchChunk(false);
    },
    replaceFilters({
      submitterIds = this.submitterIds,
      submissionDateRange = this.submissionDateRange,
      reviewStates = this.reviewStates
    }) {
      const query = {};
      if (submitterIds.length !== this.submitters.length)
        query.submitterId = submitterIds.map(id => id.toString());
      if (submissionDateRange.length !== 0) {
        query.start = submissionDateRange[0].toISODate();
        query.end = submissionDateRange[1].toISODate();
      }
      if (reviewStates.length !== this.allReviewStates.length)
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
      const index = this.odata.value.findIndex(submission =>
        submission.__id === originalSubmission.__id);
      if (index !== -1) {
        this.odata.value[index].__system.reviewState = reviewState;
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
    "noMatching": "There are no matching Submissions."
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
    "noMatching": "Es gibt keine passenden Übermittlungen."
  },
  "es": {
    "noMatching": "No hay envíos coincidentes."
  },
  "fr": {
    "noMatching": "Il n'y a pas de soumission correspondante."
  },
  "id": {
    "noMatching": "Tidak ada Pengiriman yang cocok."
  },
  "it": {
    "noMatching": "Non sono presenti invii corrispondenti."
  },
  "ja": {
    "noMatching": "照合できる提出済フォームはありません。"
  },
  "sw": {
    "noMatching": "Hakuna Mawasilisho yanayolingana."
  }
}
</i18n>
