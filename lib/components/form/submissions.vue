<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <alert v-bind="alert" @close="alert.state = false"/>
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
        <button id="form-submissions-download-button" type="button"
          class="btn btn-primary" @click="download">
          <span class="icon-arrow-circle-down"></span> {{ downloadButtonText }}
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
import alert from '../../mixins/alert';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'FormSubmissions',
  components: { FormAnalyze },
  mixins: [
    alert(),
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
      alert: alert.blank(),
      requestId: null,
      submissions: null,
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
    },
    downloadButtonText() {
      const count = this.submissions.length.toLocaleString();
      const s = this.submissions.length !== 1 ? 's' : '';
      return `Download all ${count} record${s}`;
    }
  },
  watch: {
    alert() {
      this.$emit('alert');
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
      const path = `/forms/${this.form.xmlFormId}/submissions.csv.zip`;
      this
        .get(path, { responseType: 'blob' })
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
