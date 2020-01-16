<!--
Copyright 2019 ODK Central Developers
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
    <!-- This table element contains the frozen columns of the submissions
    table, which contain metadata about each submission. -->
    <table id="submission-table1" class="table table-frozen">
      <thead>
        <tr>
          <th><!-- Row number --></th>
          <th>Submitted by</th>
          <th>Submitted at</th>
        </tr>
      </thead>
      <tbody>
        <submission-row v-for="(submission, index) in submissions"
          :key="submission.__id" :submission="submission"
          :row-number="originalCount - index"/>
      </tbody>
    </table>
    <!-- The next table element contains the form-field data and instance ID of
    each submission. -->
    <div class="table-container">
      <table id="submission-table2" :class="table2Class">
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
          <submission-row v-for="submission of submissions"
            :key="submission.__id" :submission="submission"
            :field-columns="fieldColumns"/>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import SubmissionRow from './row.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionTable',
  components: { SubmissionRow },
  props: {
    submissions: {
      type: Array,
      required: true
    },
    originalCount: {
      type: Number,
      required: true
    }
  },
  computed: {
    ...requestData(['schema']),
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
          const htmlClass = ['submission-field'];
          if (type != null && /^\w+$/.test(type))
            htmlClass.push(`submission-row-${type}-column`);
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
      return { table: true, 'field-subset': this.schemaAnalysis.subsetShown };
    },
    fieldColumns() {
      return this.schemaAnalysis.columns;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-table1 {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  th:last-child {
    border-right: $border-bottom-table-heading;
  }

  td:last-child {
    border-right: $border-top-table-data;
  }
}

#submission-table2 {
  th, td {
    &.submission-field {
      max-width: 250px;
    }

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.field-subset {
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
</style>
