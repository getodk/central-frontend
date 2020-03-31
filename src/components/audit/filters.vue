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
  <form id="audit-filters" class="form-inline" @submit.prevent>
    <span class="icon-filter"></span><span>Filter by</span>
    <div class="form-group">
      <select v-model="action" class="form-control" aria-label="Type">
        <option v-for="option of actionOptions" :key="option.value"
          :class="{ 'action-category': option.category }" :value="option.value">
          <template v-if="!option.category">&nbsp;&nbsp;&nbsp;</template>{{ option.text }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <flat-pickr v-model="dateRangeString" :config="flatPickrConfig"
        class="form-control" placeholder="Date range" aria-label="Date range"
        @on-close="closeCalendar"/>
    </div>
  </form>
</template>

<script>
import flatPickr from 'vue-flatpickr-component';
import { DateTime } from 'luxon';

export default {
  name: 'AuditFilters',
  components: { flatPickr },
  props: {
    initial: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      action: this.initial.action,
      // An array of two DateTime objects
      dateRange: this.initial.dateRange,
      dateRangeString: this.dateRangeToString(this.initial.dateRange)
    };
  },
  computed: {
    actionOptions() {
      const categoryOption = (text, value) => ({ text, value, category: true });
      const actionOption = (text, value) => ({ text, value, category: false });
      return [
        categoryOption('(All Actions)', 'nonverbose'),
        categoryOption('Web User Actions', 'user'),
        actionOption('Create', 'user.create'),
        actionOption('Update Details', 'user.update'),
        actionOption('Assign Role', 'assignment.create'),
        actionOption('Revoke Role', 'assignment.delete'),
        actionOption('Retire', 'user.delete'),
        categoryOption('Project Actions', 'project'),
        actionOption('Create', 'project.create'),
        actionOption('Update Details', 'project.update'),
        actionOption('Delete', 'project.delete'),
        categoryOption('Form Actions', 'form'),
        actionOption('Create', 'form.create'),
        actionOption('Update Details', 'form.update'),
        actionOption('Create or Update Draft', 'form.update.draft.set'),
        actionOption('Publish Draft', 'form.update.publish'),
        actionOption('Abandon Draft', 'form.update.draft.delete'),
        actionOption('Update Attachments', 'form.attachment.update'),
        actionOption('Delete', 'form.delete')
      ];
    },
    flatPickrConfig() {
      return {
        mode: 'range',
        dateFormat: 'Y/m/d'
      };
    }
  },
  watch: {
    action: 'filter'
  },
  methods: {
    dateRangeToString(dateRange) {
      const start = dateRange[0].toFormat('y/MM/dd');
      const end = dateRange[1].toFormat('y/MM/dd');
      // If start === end, then when we set this.dateRangeString to the
      // following string, vue-flatpickr-component will set this.dateRangeString
      // to `start`. However, we cannot set this.dateRangeString to `start`
      // ourselves: if we did, vue-flatpickr-component would treat the selection
      // as incomplete until the user selected an additional date.
      return `${start} to ${end}`;
    },
    filter() {
      this.$emit('filter', { action: this.action, dateRange: this.dateRange });
    },
    datesToDateRange(dates) {
      // dates.length === 0 if the user opens the calendar, clears the date
      // range (for example, by pressing backspace), then closes the calendar.
      // (There doesn't seem to be an easy way to turn off this behavior.)
      if (dates.length === 0) {
        const today = DateTime.local().startOf('day');
        return [today, today];
      }
      // dates.length === 1 if the user opens the calendar, selects a date, then
      // closes the calendar without selecting a second date -- in other words,
      // if the user makes an incomplete selection of a single date.
      if (dates.length === 1) {
        const dateTime = DateTime.fromJSDate(dates[0]);
        return [dateTime, dateTime];
      }
      return dates.map(date => DateTime.fromJSDate(date));
    },
    closeCalendar(dates) {
      const dateRange = this.datesToDateRange(dates);
      if (dateRange[0].valueOf() !== this.dateRange[0].valueOf() ||
        dateRange[1].valueOf() !== this.dateRange[1].valueOf()) {
        this.dateRange = dateRange;
        this.filter();
      }

      // If dates.length < 2, the date range selection is incomplete and
      // therefore does not match this.dateRange. Thus, regardless of whether
      // this.dateRange has changed, we need to set this.dateRangeString.
      // (Also, interestingly, the value of the flatpickr input element seems to
      // become empty even when dates.length === 1.)
      if (dates.length < 2)
        this.dateRangeString = this.dateRangeToString(dateRange);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#audit-filters {
  .icon-filter {
    color: #999;
    margin-right: 6px;
  }

  .form-group {
    margin-left: 12px;
    // Align the .form-group elements with the text to their left.
    vertical-align: baseline;
  }

  .form-group + .form-group {
    margin-left: 21px;
  }

  .action-category {
    // Not all browsers support styling an <option> element this way.
    font-weight: bold;
  }

  .flatpickr-input {
    width: $width-flatpickr-range-input;
  }
}
</style>
