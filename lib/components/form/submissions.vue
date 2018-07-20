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
  <div>
    <float-row class="table-actions">
      <template slot="left">
        <refresh-button :fetching="awaitingResponse"
          @refresh="fetchData({ clear: false })"/>
      </template>
      <template v-if="submissions != null && submissions.length !== 0"
        slot="right">
        <a ref="downloadLink" :href="downloadHref" :download="downloadFilename"
          class="hidden">
        </a>
        <button id="form-submissions-download-button"
          :disabled="awaitingResponse" type="button" class="btn btn-primary"
          @click="download">
          <span class="icon-arrow-circle-down"></span> Download all
          {{ submissions.length.toLocaleString() }}
          {{ $pluralize('record', submissions.length) }}
          <spinner :state="downloading"/>
        </button>
        <button id="form-submissions-analyze-button" type="button"
          class="btn btn-primary" @click="analyze.state = true">
          <span class="icon-plug"></span> Analyze via OData
        </button>
      </template>
    </float-row>
    <loading v-if="submissions == null" :state="awaitingResponse"/>
    <p v-else-if="submissions.length === 0">
      There are no submissions yet for
      <strong>{{ form.name || form.xmlFormId }}</strong>.
    </p>
    <table v-else class="table table-hover">
      <thead>
        <tr>
          <th>Instance ID</th>
          <th>Submitted by</th>
          <th>Submitted at</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="submission of submissions" :key="submission.instanceId">
          <td>{{ submission.instanceId }}</td>
          <td>{{ submitter(submission) }}</td>
          <td>{{ createdAt(submission) }}</td>
        </tr>
      </tbody>
    </table>
    <form-analyze :state="analyze.state" :form="form"
      @hide="analyze.state = false"/>
  </div>
</template>

<script>
import moment from 'moment';

import FormAnalyze from './analyze.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'FormSubmissions',
  components: { FormAnalyze },
  mixins: [
    modal('analyze'),
    request()
  ],
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      requestId: null,
      submissions: null,
      downloading: false,
      downloadHref: '#',
      analyze: {
        state: false
      }
    };
  },
  computed: {
    downloadFilename() {
      // The browser should sanitize the filename upon download.
      return `${this.form.xmlFormId}.zip`;
    }
  },
  created() {
    this.fetchData({ clear: false });
  },
  methods: {
    fetchData({ clear }) {
      if (clear) this.submissions = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get(`/forms/${this.form.xmlFormId}/submissions`, { headers })
        .then(({ data }) => {
          this.submissions = data;
        })
        .catch(() => {});
    },
    download() {
      this.downloading = true;
      const path = `/forms/${this.form.xmlFormId}/submissions.csv.zip`;
      this
        .get(path, { responseType: 'blob' })
        .finally(() => {
          this.downloading = false;
        })
        .then(({ data }) => {
          // Revoke the previous URL.
          if (this.downloadHref !== '#')
            window.URL.revokeObjectURL(this.downloadHref);
          this.downloadHref = window.URL.createObjectURL(data);
          this.$nextTick(() => this.$refs.downloadLink.click());
        })
        .catch(() => {});
    },
    submitter(submission) {
      const { submitter } = submission;
      return submitter != null ? submitter.displayName : '';
    },
    createdAt(submission) {
      return moment.utc(submission.createdAt).format('MMM D, Y H:mm:ss UTC');
    }
  }
};
</script>
