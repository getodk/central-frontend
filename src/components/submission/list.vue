<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="form != null">
    <loading :state="$store.getters.initiallyLoading(['keys'])"/>
    <template v-if="keys != null">
      <float-row class="table-actions">
        <template #left>
          <refresh-button :configs="configsForRefresh"/>
        </template>
        <template #right>
          <a v-if="managedKey == null" id="submission-list-download-button"
            :href="downloadPath" class="btn btn-primary" target="_blank">
            <span class="icon-arrow-circle-down"></span>{{ downloadButtonText }}
          </a>
          <button v-else id="submission-list-download-button" type="button"
            class="btn btn-primary" @click="showModal('decrypt')">
            <span class="icon-arrow-circle-down"></span>{{ downloadButtonText }}&hellip;
          </button>

          <button id="submission-list-analyze-button" type="button"
            class="btn btn-primary" :disabled="analyzeDisabled"
            :title="analyzeButtonTitle" @click="showModal('analyze')">
            <span class="icon-plug"></span>Analyze via OData&hellip;
          </button>
        </template>
      </float-row>
      <template v-if="submissions != null">
        <p v-if="submissions.length === 0" class="empty-table-message">
          There are no Submissions yet for
          <strong>{{ form.nameOrId() }}</strong>.
        </p>
        <submission-table v-else-if="fields != null" :submissions="submissions"
          :fields="fields" :original-count="originalCount"/>
      </template>
      <div v-if="message != null" id="submission-list-message">
        <div id="submission-list-spinner-container">
          <spinner :state="message.spinner"/>
        </div>
        <div id="submission-list-message-text">{{ message.text }}</div>
      </div>
    </template>

    <submission-decrypt :state="decrypt.state" :managed-key="managedKey"
      :form-action="downloadPath" @hide="hideModal('decrypt')"/>
    <submission-analyze v-bind="analyze" @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import FloatRow from '../float-row.vue';
import Loading from '../loading.vue';
import RefreshButton from '../refresh-button.vue';
import Spinner from '../spinner.vue';
import SubmissionAnalyze from './analyze.vue';
import SubmissionDecrypt from './decrypt.vue';
import SubmissionTable from './table.vue';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['form', 'keys', 'fields', 'submissionsChunk'];
const MAX_SMALL_CHUNKS = 4;

export default {
  name: 'SubmissionList',
  components: {
    FloatRow,
    Loading,
    RefreshButton,
    Spinner,
    SubmissionAnalyze,
    SubmissionDecrypt,
    SubmissionTable
  },
  mixins: [modal(), validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    chunkSizes: {
      type: Object,
      default: () => ({ small: 250, large: 1000 })
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
      submissions: null,
      instanceIds: new Set(),
      // The count of submissions at the time of the initial fetch or last
      // refresh
      originalCount: null,
      // The number of chunks that have been fetched since the initial fetch or
      // last refresh
      chunkCount: 0,
      message: null,
      // Modals
      decrypt: {
        state: false
      },
      analyze: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(REQUEST_KEYS),
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    },
    configsForRefresh() {
      return [{
        key: 'submissionsChunk',
        url: apiPaths.submissionsOData(
          this.projectId,
          this.xmlFormId,
          { $top: this.chunkSizes.small }
        ),
        success: () => {
          this.processChunk();
        }
      }];
    },
    // Returns a managed key if there is one among this.keys. Returns null if
    // there is no managed key or if this.keys is null (because this.keys is
    // still loading, for example).
    managedKey() {
      return this.keys != null ? this.keys.find(key => key.managed) : null;
    },
    downloadPath() {
      return apiPaths.submissionsZip(this.projectId, this.xmlFormId);
    },
    downloadButtonText() {
      return this.form.submissions <= 1
        ? 'Download all records'
        : `Download all ${this.form.submissions.toLocaleString()} records`;
    },
    analyzeDisabled() {
      // If an encrypted form has no submissions, then OData will never be
      // available for any of the form's submissions (so long as the form
      // remains encrypted).
      return (this.form.keyId != null && this.form.submissions === 0) ||
        this.keys.length !== 0;
    },
    analyzeButtonTitle() {
      return this.analyzeDisabled
        ? 'OData access is unavailable due to Form encryption'
        : '';
    }
  },
  watch: {
    $route() {
      this.fetchInitialData();
      this.submissions = null;
      this.instanceIds = new Set();
      this.originalCount = null;
      this.chunkCount = 0;
      this.message = null;
    }
  },
  created() {
    this.fetchInitialData();
  },
  mounted() {
    $(window).on('scroll.submission-list', this.onScroll);
  },
  beforeDestroy() {
    $(window).off('.submission-list');
  },
  methods: {
    loadingMessageText({ top, skip = 0 }) {
      if (skip === 0) {
        if (this.form == null) return 'Loading submissions…';
        if (this.form.submissions > top) {
          const count = this.form.submissions.toLocaleString();
          return `Loading the first ${top.toLocaleString()} of ${count} submissions…`;
        }
        return this.form.submissions === 1
          ? 'Loading 1 submission…'
          : `Loading ${this.form.submissions.toLocaleString()} submissions…`;
      }
      const remaining = this.originalCount - this.submissions.length;
      // This case should be rare or impossible.
      if (remaining <= 0) return 'Loading submissions…';
      if (remaining > top)
        return `Loading ${top.toLocaleString()} more of ${remaining.toLocaleString()} remaining submissions…`;
      return remaining === 1
        ? 'Loading the last submission…'
        : `Loading the last ${remaining.toLocaleString()} submissions…`;
    },
    // Sets this.form.submissions to this.submissionsChunk['@odata.count'].
    updateFormSubmissionCount() {
      if (this.form == null) return;
      if (this.form.submissions === this.submissionsChunk['@odata.count'])
        return;
      this.$store.commit('setData', {
        key: 'form',
        value: this.form.with({
          submissions: this.submissionsChunk['@odata.count']
        })
      });
    },
    processChunk(replace = true) {
      // We update this.form.submissions, but not this.form.lastSubmission, nor
      // lastSubmission for the project.
      this.updateFormSubmissionCount();

      if (replace) {
        this.submissions = this.submissionsChunk.value;
        this.instanceIds.clear();
        for (const submission of this.submissions)
          this.instanceIds.add(submission.__id);
        this.originalCount = this.submissionsChunk['@odata.count'];
        this.chunkCount = 1;
      } else {
        const lastSubmission = this.submissions[this.submissions.length - 1];
        const lastSubmissionDate = lastSubmission.__system.submissionDate;
        for (const submission of this.submissionsChunk.value) {
          // If one or more submissions have been created since the initial
          // fetch or last refresh, then the latest chunk of submissions may
          // include a newly created submission or a submission that is already
          // shown in the table.
          if (submission.__system.submissionDate <= lastSubmissionDate &&
            !this.instanceIds.has(submission.__id)) {
            this.submissions.push(submission);
            this.instanceIds.add(submission.__id);
          }
        }
        this.chunkCount += 1;
      }

      const remaining = this.originalCount - this.submissions.length;
      // A negative value should be rare or impossible.
      if (remaining <= 0)
        this.message = null;
      else {
        this.message = {
          text: remaining === 1
            ? '1 row remains.'
            : `${remaining.toLocaleString()} rows remain.`,
          spinner: false
        };
      }
    },
    fetchInitialData() {
      this.message = {
        text: this.loadingMessageText({ top: this.chunkSizes.small }),
        spinner: true
      };
      this.$store.dispatch('get', [
        {
          // We do not keep this.keys in sync with the keyId property of the
          // project or the form.
          key: 'keys',
          url: apiPaths.formKeys(this.projectId, this.xmlFormId)
        },
        {
          key: 'fields',
          url: apiPaths.formFields(this.projectId, this.xmlFormId)
        },
        {
          key: 'submissionsChunk',
          url: apiPaths.submissionsOData(
            this.projectId,
            this.xmlFormId,
            { $top: this.chunkSizes.small }
          ),
          success: () => {
            this.processChunk();
          }
        }
      ])
        .catch(() => {
          this.message = null;
        });
    },
    // Returns the value of the $skip query parameter for skipping the specified
    // number of chunks.
    skip(chunkCount) {
      if (chunkCount <= MAX_SMALL_CHUNKS)
        return chunkCount * this.chunkSizes.small;
      return (MAX_SMALL_CHUNKS * this.chunkSizes.small) +
        ((chunkCount - MAX_SMALL_CHUNKS) * this.chunkSizes.large);
    },
    // This method may need to change once we support submission deletion.
    onScroll() {
      if (!this.dataExists) return;
      // Return if the next chunk of submissions is already loading.
      if (this.$store.getters.loading('submissionsChunk')) return;
      const skip = this.skip(this.chunkCount);
      if (skip >= this.form.submissions || !this.scrolledToBottom()) return;
      const top = this.chunkCount < MAX_SMALL_CHUNKS
        ? this.chunkSizes.small
        : this.chunkSizes.large;
      this.message = {
        text: this.loadingMessageText({ top, skip }),
        spinner: true
      };
      this.$store.dispatch('get', [{
        key: 'submissionsChunk',
        url: apiPaths.submissionsOData(
          this.projectId,
          this.xmlFormId,
          { $top: top, $skip: skip }
        ),
        success: () => {
          this.processChunk(false);
        }
      }])
        .catch(() => {
          this.message = null;
        });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-list-download-button {
  margin-right: 5px;
}

#submission-list-message {
  margin-left: 28px;
  padding-bottom: 38px;
  position: relative;

  #submission-list-spinner-container {
    float: left;
    margin-right: 8px;
    position: absolute;
    top: 8px;
    width: 16px; // TODO: eventually probably better not to default spinner to center.
  }

  #submission-list-message-text {
    color: #555;
    font-size: 12px;
    padding-left: 24px;
  }
}
</style>
