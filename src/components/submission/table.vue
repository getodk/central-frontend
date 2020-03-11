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
    table, which display metadata about each submission. -->
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
    <!-- The next table element displays the data and instance ID of each
    submission. -->
    <div class="table-container">
      <table id="submission-table2"
        class="table" :class="{ 'field-subset': subsetShown }">
        <thead>
          <tr>
            <!-- Adding a title attribute in case the column header is so long
            that it is truncated. -->
            <th v-for="column of fieldColumnsToShow" :key="column.path"
              class="submission-table-field" :title="column.header">
              {{ column.header }}
            </th>
            <th>Instance ID</th>
          </tr>
        </thead>
        <tbody>
          <submission-row v-for="submission of submissions"
            :key="submission.__id" :submission="submission"
            :field-columns="fieldColumnsToShow"/>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import SubmissionRow from './row.vue';

const instanceIdPaths = ['/meta/instanceID', '/instanceID'];

const anySlash = /\//g;
const replaceWithHyphen = (match, offset) => (offset !== 0 ? '-' : '');
const pathToHeader = (path) => path.replace(anySlash, replaceWithHyphen);

export default {
  name: 'SubmissionTable',
  components: { SubmissionRow },
  props: {
    submissions: {
      type: Array,
      required: true
    },
    fields: {
      type: Array,
      required: true
    },
    originalCount: {
      type: Number,
      required: true
    }
  },
  data() {
    const { columns, anyRepeat } = this.analyzeFields();
    const fieldColumnsToShow = columns.slice(0, 10);
    const subsetShown = fieldColumnsToShow.length !== columns.length || anyRepeat;
    return { fieldColumnsToShow, subsetShown };
  },
  methods: {
    analyzeFields() {
      const columns = [];
      let anyRepeat = false;
      // The path of the top-level repeat group currently being traversed
      let repeat = null;
      for (const field of this.fields) {
        const { path } = field;
        if (repeat == null || !path.startsWith(repeat)) {
          repeat = null;
          // Note that `type` may be `undefined`, though I have seen this only
          // in the Widgets sample form (<branch>):
          // https://github.com/opendatakit/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
          const { type } = field;
          if (type === 'repeat') {
            anyRepeat = true;
            repeat = `${path}/`;
          } else if (!(type === 'structure' ||
            // We use the submission's __id property to display its instance ID.
            (type === 'string' && instanceIdPaths.includes(path)))) {
            columns.push({ ...field, header: pathToHeader(path) });
          }
        }
      }
      return { columns, anyRepeat };
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
    &.submission-table-field {
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
