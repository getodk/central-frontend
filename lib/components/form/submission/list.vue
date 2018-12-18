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
        <refresh-button :fetching="awaitingResponse" @refresh="refresh"/>
      </template>
      <template v-if="submissions != null && submissions.length !== 0"
        slot="right">
        <a id="form-submission-list-download-button" :href="downloadHref"
          class="btn btn-primary" target="_blank">
          <span class="icon-arrow-circle-down"></span>Download all
          {{ form.submissions.toLocaleString() }}
          {{ $pluralize('record', form.submissions) }}
        </a>
        <button id="form-submission-list-analyze-button" type="button"
          class="btn btn-primary" @click="showModal('analyze')">
          <span class="icon-plug"></span>Analyze via OData
        </button>
      </template>
    </float-row>
    <p v-if="submissions != null && submissions.length === 0">
      There are no submissions yet for <strong>{{ form.nameOrId() }}</strong>.
    </p>
    <template v-else-if="submissions != null">
      <!-- This table element contains the frozen columns of the submissions
      table, which contain metadata about each submission. -->
      <table id="form-submission-list-table1" class="table table-condensed">
        <thead>
          <tr>
            <th><!-- Row number --></th>
            <th>Submitted by</th>
            <th>Submitted at</th>
          </tr>
        </thead>
        <tbody>
          <form-submission-row v-for="(submission, index) in submissions"
            :key="submission.__id" :form="form" :submission="submission"
            :row-number="originalCount - index"/>
        </tbody>
      </table>
      <!-- The next table element contains the form-field data and instance ID
      of each submission. -->
      <div id="form-submission-list-table2-container">
        <table id="form-submission-list-table2" :class="table2Class">
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
              :field-columns="fieldColumns"/>
          </tbody>
        </table>
      </div>
    </template>
    <div v-if="message != null" id="form-submission-list-message">
      <div id="form-submission-list-spinner-container">
        <spinner :state="message.spinner"/>
      </div>
      <div id="form-submission-list-message-text">{{ message.text }}</div>
    </div>
    <form-submission-analyze :state="analyze.state" :form="form"
      @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import Form from '../../../presenters/form';
import FormSubmissionAnalyze from './analyze.vue';
import FormSubmissionRow from './row.vue';
import modal from '../../../mixins/modal';
import request from '../../../mixins/request';

const MAX_SMALL_CHUNKS = 4;

export default {
  name: 'FormSubmissionList',
  components: { FormSubmissionAnalyze, FormSubmissionRow },
  mixins: [
    modal('analyze'),
    request()
  ],
  // Setting this in order to ignore attributes from FormShow that are intended
  // for other form-related components.
  inheritAttrs: false,
  props: {
    form: {
      type: Form,
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
      requestId: null,
      schema: null,
      submissions: null,
      instanceIds: new Set(),
      // The count of submissions at the time of the initial fetch or last
      // refresh
      originalCount: null,
      // The number of chunks that have been fetched since the initial fetch or
      // last refresh
      chunks: 0,
      message: null,
      analyze: {
        state: false
      }
    };
  },
  computed: {
    downloadHref() {
      return `/v1/forms/${this.form.encodedId()}/submissions.csv.zip`;
    },
    // Returns information about the schema after processing it.
    schemaAnalysis() {
      // `columns` holds the columns of the table that correspond to a form
      // field. We display a maximum of 10 such columns in the table.
      const columns = [];
      let idFieldCount = 0;
      for (const field of this.schema) {
        // Note that the field might not have a type, in which case `type` will
        // be undefined -- though I have seen a field without a type only in the
        // Widgets sample form (<branch>):
        // https://github.com/opendatakit/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
        const { type, path } = field;
        // We already display __id as the instance ID, so if there is also an
        // meta.instanceID or instanceID field, we do not display it. Further,
        // if the only fields that we do not display are instanceID fields, we
        // do not show the field subset indicator.
        if (type === 'string' &&
          ((path.length === 2 && path[0] === 'meta' && path[1] === 'instanceID') ||
          (path.length === 1 && path[0] === 'instanceID')))
          idFieldCount += 1;
        else if (type !== 'repeat' && columns.length < 10) {
          const header = path.join('-');
          const htmlClass = ['form-submission-list-field'];
          if (type != null && /^\w+$/.test(type))
            htmlClass.push(`form-submission-list-${type}-column`);
          const key = this.$uniqueId();
          columns.push({ type, path, header, htmlClass, key });
        }
      }
      return {
        columns,
        subsetShown: columns.length !== this.schema.length - idFieldCount
      };
    },
    table2Class() {
      return {
        table: true,
        'table-condensed': true,
        'form-submission-list-field-subset': this.schemaAnalysis.subsetShown
      };
    },
    fieldColumns() {
      return this.schemaAnalysis.columns;
    }
  },
  created() {
    this.fetchSchemaAndFirstChunk();
  },
  activated() {
    $(window).on('scroll.form-submission-list', this.onScroll);
  },
  deactivated() {
    $(window).off('.form-submission-list');
  },
  methods: {
    chunkURL({ top, skip = 0 }) {
      const queryString = `%24top=${top}&%24skip=${skip}&%24count=true`;
      return `/forms/${this.form.encodedId()}.svc/Submissions?${queryString}`;
    },
    processChunk({ data }, replace) {
      if (data['@odata.count'] !== this.form.submissions)
        this.$emit('update:submissions', data['@odata.count']);
      if (replace) {
        this.submissions = data.value != null ? data.value : [];
        this.instanceIds.clear();
        for (const submission of this.submissions)
          this.instanceIds.add(submission.__id);
        this.originalCount = data['@odata.count'];
        this.chunks = 1;
      } else {
        if (data.value != null) {
          const lastSubmission = this.submissions[this.submissions.length - 1];
          const lastSubmissionDate = lastSubmission.__system.submissionDate;
          for (const submission of data.value) {
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
        this.chunks += 1;
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
    loadingMessageText({ top, skip = 0 }) {
      if (skip === 0) {
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
    fetchSchemaAndFirstChunk() {
      const schemaRequest = this.$http
        .get(`/forms/${this.form.encodedId()}.schema.json?flatten=true`);
      const submissionsRequest = this.$http
        .get(this.chunkURL({ top: this.chunkSizes.small }));
      this.requestAll([schemaRequest, submissionsRequest])
        .then(([schema, submissions]) => {
          this.schema = schema.data;
          this.processChunk(submissions, true);
        })
        .catch(() => {});
      this.message = {
        text: this.loadingMessageText({ top: this.chunkSizes.small }),
        spinner: true
      };
    },
    refresh() {
      this.get(this.chunkURL({ top: this.chunkSizes.small }))
        .then(submissions => this.processChunk(submissions, true))
        .catch(() => {});
    },
    // Returns the value of the $skip query parameter for skipping the specified
    // number of chunks.
    skip(chunks) {
      if (chunks <= MAX_SMALL_CHUNKS) return chunks * this.chunkSizes.small;
      return (MAX_SMALL_CHUNKS * this.chunkSizes.small) +
        ((chunks - MAX_SMALL_CHUNKS) * this.chunkSizes.large);
    },
    // This method may need to change once we support submission deletion.
    onScroll() {
      const skip = this.skip(this.chunks);
      if (skip >= this.form.submissions || this.awaitingResponse ||
        !this.scrolledToBottom())
        return;
      const top = this.chunks < MAX_SMALL_CHUNKS
        ? this.chunkSizes.small
        : this.chunkSizes.large;
      this.get(this.chunkURL({ top, skip }))
        .then(submissions => this.processChunk(submissions, false))
        .catch(() => {});
      this.message = {
        text: this.loadingMessageText({ top, skip }),
        spinner: true
      };
    }
  }
};
</script>

<style lang="sass">
@import '../../../../assets/scss/variables';

#form-submission-list-table1 {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  float: left;
  width: unset;

  > thead > tr > th {
    &:last-child {
      border-right: $border-bottom-table-heading;
    }
  }

  > tbody > tr > td {
    &:last-child {
      border-right: $border-top-table-data;
    }

    &.form-submission-list-row-number {
      color: $color-text-muted;
      font-size: 11px;
      // Adding min-width so that the table's width does not increase as the row
      // numbers increase.
      min-width: 42px;
      padding-top: 11px;
      text-align: right;
      vertical-align: middle;
    }
  }
}

#form-submission-list-table2-container {
  // Placing the margin here rather than on the table so that the horizontal
  // scrollbar appears immediately below the table, above the margin.
  margin-bottom: $margin-bottom-table;
  overflow-x: scroll;
}

#form-submission-list-table2 {
  margin-bottom: 0;

  thead > tr > th, tbody > tr > td {
    &.form-submission-list-field {
      max-width: 250px;
    }

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  tbody > tr > td {
    &.form-submission-list-int-column,
    &.form-submission-list-decimal-column {
      text-align: right;
    }

    &.form-submission-list-binary-column {
      text-align: center;
    }
  }

  .form-submission-list-binary-link {
    background-color: $color-subpanel-background;
    border-radius: 99px;
    padding: 4px 7px;
    text-decoration: none;

    .icon-check {
      margin-right: 0;
    }

    .icon-download {
      border-left: 1px dotted #ccc;
      color: #bbb;
      padding-left: 5px;
    }

    &:hover .icon-download {
      color: $color-action-foreground;
    }
  }


  &.form-submission-list-field-subset {
    $subset-padding-left: 30px;

    thead th:last-child {
      $color-fill: $color-table-heading-background;
      $color-break: $color-page-background;
      $zig-size: 10px;
      background: linear-gradient(-135deg, $color-fill 5px, transparent 0) 0 5px,
        linear-gradient(135deg, $color-break 9px, $color-fill 0) 0 5px;
      background-position: 10px 5px;
      background-repeat: repeat-y;
      background-size: $zig-size $zig-size;
      overflow: visible; // this is okay for "Instance ID", which is never truncated.
      padding-left: $subset-padding-left;
      position: relative;

      &::before {
        background: linear-gradient(-135deg, transparent 9px, $color-fill 0) 0 5px,
          linear-gradient(135deg, $color-fill 5px, $color-break 0) 0 5px;
        background-position: left top;
        background-repeat: repeat-y;
        background-size: $zig-size $zig-size;
        content: '';
        display: block;
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: $zig-size;
      }

      &::after { // TODO: is there a cleverer way to do this?
        border-bottom: 1px solid $color-page-background;
        content: '';
        display: block;
        left: 7px;
        position: absolute;
        top: 100%;
        width: 11px;
      }
    }

    tbody td:last-child {
      padding-left: $subset-padding-left;
      position: relative;

      &::before {
        color: #999;
        content: '…';
        display: block;
        left: 4px;
        top: 4px;
        pointer-events: none;
        position: absolute
      }
    }
  }
}

#form-submission-list-message {
  margin-left: 28px;
  padding-bottom: 38px;
  position: relative;

  #form-submission-list-spinner-container {
    float: left;
    margin-right: 8px;
    position: absolute;
    top: 8px;
    width: 16px; // TODO: eventually probably better not to default spinner to center.
  }

  #form-submission-list-message-text {
    color: #555;
    font-size: 12px;
    padding-left: 24px;
  }
}
</style>
