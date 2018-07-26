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
    <template v-else>
      <!-- This table element contains the frozen columns of the submissions
      table, which contain metadata about each submission. -->
      <table id="form-submissions-table1" class="table table-condensed">
        <thead>
          <tr>
            <th>Submitted by</th>
            <th>Submitted at</th>
          </tr>
        </thead>
        <tbody>
          <form-submission-row v-for="submission of submissions"
            :key="submission.__id" :submission="submission"/>
        </tbody>
      </table>
      <!-- The next table element contains the question data and instance ID of
      each submission. -->
      <div id="form-submissions-table2-container">
        <table id="form-submissions-table2" class="table table-condensed">
          <thead>
            <tr>
              <!-- Adding a title attribute in case the column header is so long
              that it is truncated. -->
              <th v-for="column of questionColumns" :key="column.key"
                :class="column.htmlClass" :title="column.header">
                {{ column.header }}
              </th>
              <th>Instance ID</th>
            </tr>
          </thead>
          <tbody>
            <form-submission-row v-for="submission of submissions"
              :key="submission.__id" :submission="submission"
              :question-columns="questionColumns"/>
          </tbody>
        </table>
      </div>
    </template>
    <form-analyze :state="analyze.state" :form="form"
      @hide="analyze.state = false"/>
  </div>
</template>

<script>
import FormAnalyze from './analyze.vue';
import FormSubmissionRow from './submission-row.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'FormSubmissions',
  components: { FormAnalyze, FormSubmissionRow },
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
      schema: null,
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
    },
    // Returns the columns of the table that correspond to an element of the
    // form (to a question). We display a maximum of 10 such columns in the
    // table.
    questionColumns() {
      const columns = [];
      for (let i = 0; columns.length < 10 && i < this.schema.length; i += 1) {
        // Note that schema[i] might not have a type property, in which case
        // `type` will be undefined -- though I have seen a question without a
        // type only in the Widgets sample form (<branch>):
        // https://github.com/opendatakit/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
        const { type, path } = this.schema[i];
        // We already display __id as the instance ID, so if there is also an
        // meta.instanceID or instanceID element, we do not display it.
        const isInstanceId = type === 'string' &&
          ((path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
          (path.length === 1 && path[0] === 'instanceID'));
        if (!(type === 'repeat' || isInstanceId)) {
          const header = path.join('-');
          const htmlClass = ['form-submissions-question-column'];
          if (type != null && /^\w+$/.test(type))
            htmlClass.push(`form-submissions-${type}-column`);
          const key = this.$uniqueId();
          columns.push({ type, path, header, htmlClass, key });
        }
      }
      return columns;
    }
  },
  created() {
    this.fetchData({ clear: false });
  },
  methods: {
    fetchData({ clear }) {
      if (clear) {
        this.schema = null;
        this.submissions = null;
      }
      this.requestAll([
        this.$http.get(`/forms/${this.form.xmlFormId}.schema.json?flatten=true`),
        this.$http.get(`/forms/${this.form.xmlFormId}.svc/Submissions`)
      ])
        .then(([schema, submissions]) => {
          this.schema = schema.data;
          this.submissions = submissions.data.value != null
            ? submissions.data.value
            : [];
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
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#form-submissions-table1 {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  float: left;
  width: unset;

  > thead > tr > th:last-child {
    border-right: $border-bottom-table-heading;
  }

  > tbody > tr > td:last-child {
    border-right: $border-top-table-data;
  }
}

#form-submissions-table2-container {
  // Placing the margin here rather than on the table so that the horizontal
  // scrollbar appears immediately below the table, above the margin.
  margin-bottom: $margin-bottom-table;
  overflow-x: scroll;
}

#form-submissions-table2 {
  margin-bottom: 0;

  thead > tr > th, tbody > tr > td {
    &.form-submissions-question-column {
      max-width: 250px;
    }

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tbody > tr > td {
    &.form-submissions-int-column,
    &.form-submissions-decimal-column {
      text-align: right;
    }

    &.form-submissions-binary-column {
      text-align: center;
    }
  }
}
</style>
