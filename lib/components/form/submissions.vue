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
        <a id="form-submissions-download-button" :href="downloadHref"
          :class="{ disabled: awaitingResponse }" class="btn btn-primary"
          target="_blank">
          <span class="icon-arrow-circle-down"></span> Download all
          {{ submissions.length.toLocaleString() }}
          {{ $pluralize('record', submissions.length) }}
        </a>
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
            :key="submission.__id" :form="form" :submission="submission"/>
        </tbody>
      </table>
      <!-- The next table element contains the form-field data and instance ID
      of each submission. -->
      <div id="form-submissions-table2-container">
        <table id="form-submissions-table2" class="table table-condensed">
          <thead>
            <tr>
              <!-- Adding a title attribute in case the column header is so long
              that it is truncated. -->
              <th v-for="column of fieldColumns" :key="column.key"
                :class="column.htmlClass" :title="column.header">
                {{ column.header }}
              </th>
              <th>Instance ID</th>
            </tr>
          </thead>
          <tbody>
            <form-submission-row v-for="submission of submissions"
              :key="submission.__id" :form="form" :submission="submission"
              :question-columns="fieldColumns"/>
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
  // Setting this in order to ignore the `attachments` attribute.
  inheritAttrs: false,
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
      analyze: {
        state: false
      }
    };
  },
  computed: {
    downloadHref() {
      return `/v1/forms/${this.form.encodedId()}/submissions.csv.zip`;
    },
    // Returns the columns of the table that correspond to a form field. We
    // display a maximum of 10 such columns in the table.
    fieldColumns() {
      const columns = [];
      for (let i = 0; columns.length < 10 && i < this.schema.length; i += 1) {
        // Note that schema[i] might not have a type property, in which case
        // `type` will be undefined -- though I have seen a field without a type
        // only in the Widgets sample form (<branch>):
        // https://github.com/opendatakit/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
        const { type, path } = this.schema[i];
        // We already display __id as the instance ID, so if there is also an
        // meta.instanceID or instanceID element, we do not display it.
        const isInstanceId = type === 'string' &&
          ((path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
          (path.length === 1 && path[0] === 'instanceID'));
        if (!(type === 'repeat' || isInstanceId)) {
          const header = path.join('-');
          const htmlClass = ['form-submissions-field'];
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
    &.form-submissions-field {
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

  .form-submissions-binary-link {
    background-color: $color-subpanel-background;
    border-radius: 99px;
    padding: 4px 7px;

    .icon-download {
      border-left: 1px dotted #ccc;
      color: #bbb;
      padding-left: 5px;
    }

    &:hover .icon-download {
      color: $color-action-foreground;
    }
  }
}
</style>
