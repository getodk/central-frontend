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
    <float-row class="table-actions">
      <template slot="left">
        <refresh-button :configs="configsForRefresh"/>
      </template>
      <template v-if="submissions != null && submissions.length !== 0"
        slot="right">
        <a id="submission-list-download-button" :href="downloadHref"
          class="btn btn-primary" target="_blank">
          <span class="icon-arrow-circle-down"></span>Download all
          {{ $pluralize('record', form.submissions, true) }}
        </a>
        <button id="submission-list-analyze-button" type="button"
          class="btn btn-primary" @click="showModal('analyze')">
          <span class="icon-plug"></span>Analyze via OData
        </button>
      </template>
    </float-row>

    <p v-if="submissions != null && submissions.length === 0"
      class="empty-table-message">
      There are no Submissions yet for <strong>{{ form.nameOrId() }}</strong>.
    </p>
    <submission-table v-else-if="schema != null && submissions != null"
      :project-id="projectId" :submissions="submissions"
      :original-count="originalCount"/>

    <div v-if="message != null" id="submission-list-message">
      <div id="submission-list-spinner-container">
        <spinner :state="message.spinner"/>
      </div>
      <div id="submission-list-message-text">{{ message.text }}</div>
    </div>
    <submission-analyze :project-id="projectId" :state="analyze.state"
      @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import SubmissionAnalyze from './analyze.vue';
import SubmissionTable from './table.vue';
import modal from '../../mixins/modal';
import { requestData } from '../../store/modules/request';

const MAX_SMALL_CHUNKS = 4;

export default {
  name: 'SubmissionList',
  components: { SubmissionAnalyze, SubmissionTable },
  mixins: [modal()],
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
      analyze: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(['form', 'schema', 'submissionsChunk']),
    configsForRefresh() {
      return [{
        key: 'submissionsChunk',
        url: this.chunkURL({ top: this.chunkSizes.small }),
        success: () => {
          this.processChunk();
        }
      }];
    },
    encodedFormId() {
      return encodeURIComponent(this.xmlFormId);
    },
    downloadHref() {
      return `/v1/projects/${this.projectId}/forms/${this.encodedFormId}/submissions.csv.zip`;
    }
  },
  watch: {
    $route(newRoute, oldRoute) {
      // Do not do anything if the user has simply navigated to another tab for
      // the same form.
      if (newRoute.params.projectId === oldRoute.params.projectId &&
        newRoute.params.xmlFormId === oldRoute.params.xmlFormId)
        return;

      // Reset the component. Even if after the route change, the component is
      // not rendered by the FormShow <router-view> (that is, even if the
      // component is not the active tab), the component will still be kept
      // alive, so it must be reset.
      this.submissions = null;
      this.instanceIds = new Set();
      this.originalCount = null;
      this.chunkCount = 0;
      this.message = null;

      if (oldRoute.name === 'SubmissionList' &&
        newRoute.name === 'SubmissionList') {
        // The route has changed, but the component's `activated` hook will not
        // be called. Because of that, we call this.fetchSchemaAndFirstChunk()
        // here instead.
        this.fetchSchemaAndFirstChunk();
      }
    }
  },
  activated() {
    // If the user navigates from this tab to another tab, then back to this
    // tab, we do not send a new request.
    if (this.schema == null && !this.$store.getters.loading('schema'))
      this.fetchSchemaAndFirstChunk();
    $(window).on('scroll.submission-list', this.onScroll);
  },
  deactivated() {
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
    chunkURL({ top, skip = 0 }) {
      const queryString = `%24top=${top}&%24skip=${skip}&%24count=true`;
      return `/projects/${this.projectId}/forms/${this.encodedFormId}.svc/Submissions?${queryString}`;
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
        this.submissions = this.submissionsChunk.value != null
          ? this.submissionsChunk.value
          : [];
        this.instanceIds.clear();
        for (const submission of this.submissions)
          this.instanceIds.add(submission.__id);
        this.originalCount = this.submissionsChunk['@odata.count'];
        this.chunkCount = 1;
      } else {
        if (this.submissionsChunk.value != null) {
          const lastSubmission = this.submissions[this.submissions.length - 1];
          const lastSubmissionDate = lastSubmission.__system.submissionDate;
          for (const submission of this.submissionsChunk.value) {
            // If one or more submissions have been created since the initial
            // fetch or last refresh, then the latest chunk of submissions may
            // include a newly created submission or a submission that is
            // already shown in the table.
            if (submission.__system.submissionDate <= lastSubmissionDate &&
              !this.instanceIds.has(submission.__id)) {
              this.submissions.push(submission);
              this.instanceIds.add(submission.__id);
            }
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
    fetchSchemaAndFirstChunk() {
      this.message = {
        text: this.loadingMessageText({ top: this.chunkSizes.small }),
        spinner: true
      };
      this.$store.dispatch('get', [
        {
          key: 'schema',
          url: `/projects/${this.projectId}/forms/${this.encodedFormId}.schema.json?flatten=true&odata=true`
        },
        {
          key: 'submissionsChunk',
          url: this.chunkURL({ top: this.chunkSizes.small }),
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
      // Return if the request for the form is in progress or resulted in an
      // error.
      if (this.form == null) return;
      if (this.schema == null) return;
      // If the refresh button is clicked after the first chunk has been
      // received, then `this.submissionsChunk == null` will be `false`, but
      // this.$store.getters.loading('submissionsChunk') will be `true`.
      if (this.submissionsChunk == null ||
        this.$store.getters.loading('submissionsChunk'))
        return;
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
        url: this.chunkURL({ top, skip }),
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
