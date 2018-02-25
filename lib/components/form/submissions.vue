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
  <div v-if="submissions == null">
    <alert v-bind="alert" @close="alert.state = false"/>
    <loading :state="awaitingResponse"/>
  </div>
  <p v-else-if="submissions.length === 0">
    There are no submissions yet for “{{ form.name || form.xmlFormId }}”.
  </p>
  <div v-else>
    <float-row>
      <a ref="downloadLink" :href="downloadHref" :download="downloadFilename"
        class="hidden">
      </a>
      <button type="button" ref="downloadButton" class="btn btn-primary"
        @click="download">
        {{ downloadButtonText }}
      </button>
    </float-row>
    <table class="table table-hover">
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
  </div>
</template>

<script>
import moment from 'moment';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FormSubmissions',
  mixins: [alert(), request()],
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
      downloadHref: '#'
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
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.submissions = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get(`/forms/${this.form.xmlFormId}/submissions`, { headers })
        .then(submissions => {
          this.submissions = submissions;
        })
        .catch(() => {});
    },
    download() {
      const path = `/forms/${this.form.xmlFormId}/submissions.csv.zip`;
      this
        .get(path, { responseType: 'blob' })
        .then(blob => {
          // Revoke the previous URL.
          if (this.downloadHref !== '#')
            window.URL.revokeObjectURL(this.downloadHref);
          this.downloadHref = window.URL.createObjectURL(blob);
          this.$nextTick(() => {
            this.$refs.downloadLink.click();
            this.$refs.downloadButton.blur();
          });
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
